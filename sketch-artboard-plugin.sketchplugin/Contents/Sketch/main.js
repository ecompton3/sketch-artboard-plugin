@import 'util.js'

function createPair(context) {
    var doc = context.document;
    var selection = context.selection;
    if(selection.length == 0) {
        doc.showMessage("At Least One Artboard Not Selected");
        return;
    }
    var copyNames = []
    var numBoards = 0
    for(var i = 0; i < selection.length; i++) {
        var current = selection[i];
        if([current className] == "MSArtboardGroup") {
            copyNames.push([current name] + '');
            numBoards +=1
        }
    }
    if(numBoards == 0) {
        doc.showMessage("At Least One Artboard Must Be Selected");
        return;
    }
    var boardNames = getAllArtboardNames(context)
    var window = createDropDownWindow(context,"Create Pairing",boardNames);
  var alert = window[0]; 

  var response = alert.runModal();
  if (response != "1000"){
    return;
  }
  var masterName = getDropdownValue();
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
    print(json)
    writeJSONToFile(context, json)
    doc.showMessage("Pairing Created");
    updatePairs(context);
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
            for(var j = 0; j < current.copies.length; j++) {
                var copyName = current.copies[j];
                var copy = findArtboard(doc, copyName)
                if(copy) {
                    removeArtboardByName(copy,current.master);
                }
            }
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
    if(selection.length < 1) {
        doc.showMessage("An Artboard Must Be Selected");
        return;
    }
    
    var copy;
    var numBoards = 0;
    for(var y = 0; y < selection.length; y++) {
        var s = selection[y]
        if([s className] == "MSArtboardGroup") {
             copy = s
             numBoards += 1;
        }
    }

    if(numBoards != 1) {
        doc.showMessage("Exactly One Artboard Must Be Selected");
        return;
    }

    
    var copyName = ([copy name] + '');
    var syncNames = []
    var layers = copy.layers()
    for(var x = 0; x < layers.length; x++) {
        var layer = layers[x];
        var layerName = [layer name]
        if([layer className] == "MSArtboardGroup" && layerName.indexOf('-synced')) {
            var nameToAdd = layerName.split('-')[0];
            syncNames.push(nameToAdd);
        }
    }
    var window = createDropDownWindow(context,"Remove Pairing", syncNames);
    var alert = window[0]; 

    var response = alert.runModal();
    if (response != "1000"){
      return;
    }
    var masterName = getDropdownValue();
    log(masterName);
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
                    var index = current.copies.indexOf(copyName)
                    if(index >= 0) {
                        copiesToRemove.push(index);
                        removeArtboardByName(copy, masterName)
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