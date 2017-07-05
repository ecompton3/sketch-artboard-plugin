@import 'util.js'

function createPair(context) {
    var doc = context.document;
    var selection = context.selection;
    if(selection.length == 0) {
        doc.showMessage("At Least One Artboard Not Selected");
        return;
    }
    var copyNames = []
    for(var i = 0; i < selection.length; i++) {
        var current = selection[i];
        if([current className] != "MSArtboardGroup") {
            doc.showMessage("Selections Must Only Be Artboards");
            return;
        }
        copyNames.push([current name] + '');
    }
    
    var masterName = [doc askForUserInput:"Name of Artboard to use as Master:" initialValue:""];
    if(!masterName || masterName == ""){
        doc.showMessage("No Name Provided");
        return;
    }
    if(!findArtboard(doc, masterName)) {
        doc.showMessage("Artboard Does Not Exist");
        return;
    }
    var json = readJSONfromFile(context);
    var masterExists = false;
    if(json) {
        for (var i = 0; i < json.pairs.length; i++) {
            var current = json.pairs[i];
            if(current.master == masterName) {
                for(var j = 0; j < copyNames.length; j++) {
                    if(current.copies.indexOf(copyNames[j]) >= 0) {
                        continue;
                    }
                    json.pairs[i].copies.push(copyNames[j]);
                }
                masterExists = true   
            }
        }
    } else {
        json = {"pairs":[]}
    }
    if(!masterExists) {
        // Need to coerce vlaues to JS String objects
        json.pairs.push({
            "master" : masterName + '',
            "copies": copyNames
        })
    }
    writeJSONToFile(context, json)
    doc.showMessage("Pairing Created");
}

function updatePairs(context) {
    var doc = context.document;
    var pairings = readJSONfromFile(context);
    if(!pairings) {
        doc.showMessage("No Pairings Exist");
        return;
    }
    var mastersToRemove = []
    for (var i = 0; i < pairings.pairs.length; i++) {
        var current = pairings.pairs[i];
        var master = findArtboard(doc, current.master);
        var copiesToRemove = []
        if(!master) {
            mastersToRemove.push(i);
            continue;
        }
        for(var j = 0; j < current.copies.length; j++) {
            var copyName = current.copies[j]
            var copy = findArtboard(doc, copyName)
            if(!copy) {
                copiesToRemove.push(i);
                continue;
            }
            createNewArtboard(master, copy);
            copy.removeFromParent();
        }
        var newCopies = current.copies.filter(function(element,index){
            return copiesToRemove.indexOf(index) < 0;
        });
        pairings.pairs[i].copies = newCopies;        
    }
    var newMasters = pairings.pairs.filter(function(element,index){
            return mastersToRemove.indexOf(index) < 0;
    });
    pairings.pairs = newMasters;
    writeJSONToFile(context, pairings);
    doc.showMessage("Pairings Updated");
}

function removePair(context) {
    var doc = context.document;
    var selection = context.selection;
    if(selection.length == 0) {
        doc.showMessage("At Least One Artboard Not Selected");
        return;
    }
    var copyNames = []
    for(var i = 0; i < selection.length; i++) {
        var current = selection[i];
        if([current className] != "MSArtboardGroup") {
            doc.showMessage("Selections Must Only Be Artboards");
            return;
        }
        copyNames.push([current name] + '');
    }
    
    var masterName = [doc askForUserInput:"Name of Artboard currently set as Master:" initialValue:""];
    if(!masterName || masterName == ""){
        doc.showMessage("No Name Provided");
        return;
    }
    if(!findArtboard(doc, masterName)) {
        doc.showMessage("Artboard Does Not Exist");
        return;
    }
    var json = readJSONfromFile(context);
    if(json) {
        for (var i = 0; i < json.pairs.length; i++) {
            var current = json.pairs[i];
            var copiesToRemove = [];
            if(current.master == masterName) {
                for(var j = 0; j < copyNames.length; j++) {
                    if(current.copies.indexOf(copyNames[j]) >= 0) {
                        copiesToRemove.push(j);
                    }
                }
                var newCopies = current.copies.filter(function(element,index){
                    return copiesToRemove.indexOf(index) < 0;
                });
                json.pairs[i].copies = newCopies;
                break;
            }
        }
        writeJSONToFile(context, json)
        doc.showMessage("Pairing Removed");
    } else {
        doc.showMessage("No pairings exist for document");
    }
    
}