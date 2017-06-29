@import 'util.js'

function createPair(context) {
    var doc = context.document;
    var selection = context.selection;
    if(selection.length !== 1) {
        doc.showMessage("One Artboard Not Selected");
        return;
    }
    var master = selection.firstObject();
    if([master className] != "MSArtboardGroup") {
        doc.showMessage("Selection is not an Artboard");
        return;
    }
    var copyName = [doc askForUserInput:"Name of Artboard to Copy To:" initialValue:""];
    doc.showMessage(copyName);
    var json = readJSONfromFile(doc);
    var pairExists = false;
    if(json) {
        for (var i = 0; i < json.pairs.length; i++) {
            var current = json.pairs[i];
            if(current.master == [master name] && current.copy == copyName) {
                pairExists = true;
                doc.showMessage("Pairing Already Exsists");
                break;
            }
        }
    } else {
        json = {"pairs":[]}
    }
    if(!pairExists) {
        var masterName = [master name];
        // Need to convert vlaues to JS String objects
        json.pairs.push({
            "master": masterName + '',
            "copy": copyName + ''
        })
        writeJSONToFile(doc, json)
        doc.showMessage("Pairing Created");
    }
}

function updatePairs(context) {
    var doc = context.document;
    var pairings = readJSONfromFile(doc);
    if(!pairings) {
        doc.showMessage("No Pairings Exist");
        return;
    }
    for (var i = 0; i < pairings.pairs.length; i++) {
        var current = pairings.pairs[i];
        var master = findArtboard(doc, current.master);
        var copy = findArtboard(doc, current.copy)
        if(!master || !copy) {
            doc.showMessage("Pairing " + current.master + '/' + current.copy + ' no longer exists');
            continue;
        }
        createNewArtboard(master, copy);
        copy.removeFromParent();
    }
}