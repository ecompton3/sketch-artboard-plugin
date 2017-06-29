var getFilePath = function (doc) {
    var path = doc.fileURL().path();
    var parts = path.split('/');
    var build = '/';
    for(var i = 0; i< parts.length-1; i++) {
      if(parts[i] !== "") {
          build += parts[i] + '/';
      }
    }
    return build+doc.cloudName()+"-pairings.json";
}

var writeJSONToFile = function (doc, jsonObj) {
    var file = NSString.stringWithString(JSON.stringify(jsonObj, null, "\t"));
    var filePath = getFilePath(doc);
    [file writeToFile: filePath atomically: true encoding: NSUTF8StringEncoding error: null];
}
var readJSONfromFile = function(doc) {
    
    var filePath = getFilePath(doc)
    var fileContents = NSString.stringWithContentsOfFile(filePath);
    return JSON.parse(fileContents);
}

var createNewArtboard = function(master, copy) {
    masterRect = [master absoluteRect];
    newArtboardWidth = [masterRect width];
    newArtboardHeight = [masterRect height];
    
    copyRect = [copy absoluteRect];
    copyX = [copyRect rulerX];
    copyY = [copyRect rulerY];

    newArtboardX = copyX;
    newArtboardY = copyY;

    newArtboard = [MSArtboardGroup new];
    newArtboardFrame = [newArtboard frame];
    [newArtboardFrame setWidth:newArtboardWidth];
    [newArtboardFrame setHeight:newArtboardHeight];
    [newArtboardFrame setX:newArtboardX];
    [newArtboardFrame setY:newArtboardY];

    masterItemCopy = [master duplicate];
    [[newArtboard layers] addObject:masterItemCopy];
    var extraLayers = [NSMutableArray array];
    for(var j = 0; j < [[copy layers] count]; j++) {
        var layer = [[copy layers] objectAtIndex:j];
        log(layer)
        if([layer className] != "MSArtboardGroup" || [layer name] != [master name]) {
            [extraLayers addObject: layer]
        }
    }
    log(extraLayers);
    [newArtboard addLayers:extraLayers];



    masterItemCopyFrame = [masterItemCopy frame];
    [masterItemCopyFrame setX:0];
    [masterItemCopyFrame setY:0];

    parentGroup = [master parentGroup];
    [parentGroup removeLayer:masterItemCopy];
    [newArtboard setName: [copy name]];
    page = [copy parentGroup];
    [page addLayers:[NSArray arrayWithObjects:newArtboard]];
}

var findArtboard = function(doc, name) {
    var predicate = NSPredicate.predicateWithFormat("name == %@", name)
    var filteredArray = NSArray.array()
    var loopPages = doc.pages().objectEnumerator(), page;
    while (page = loopPages.nextObject()) {
        scope = page.artboards()
        filteredArray = filteredArray.arrayByAddingObjectsFromArray(scope.filteredArrayUsingPredicate(predicate))
    }

    if(filteredArray.length == 0) {
        return null;
    }

    return filteredArray[0]
}