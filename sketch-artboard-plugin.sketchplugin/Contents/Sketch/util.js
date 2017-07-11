var getFilePath = function (context) {
    var path = context.scriptPath;
    var parts = path.split('/');
    var build = '/';
    // We do -4 as that gets us the path to the top level plugin directory for sketch
    // saving inside the plugin would mean the files are lost upon upgrade of the plugin
    for(var i = 0; i< parts.length-4; i++) {
      if(parts[i] !== "") {
          build += parts[i] + '/';
      }
    }
    return build+context.document.cloudName()+"-pairings.json";
}

var errorHandler = function(error) {
    log(error);
}

var writeJSONToFile = function (context, jsonObj) {
    var file = NSString.stringWithString(JSON.stringify(jsonObj, null, "\t"));
    var filePath = getFilePath(context);
    [file writeToFile: filePath atomically: true encoding: NSUTF8StringEncoding error: errorHandler];
}
var readJSONfromFile = function(context) {
    var filePath = getFilePath(context)
    var fileContents = NSString.stringWithContentsOfFile(filePath);
    return JSON.parse(fileContents);
}

var removeArtboardByName = function(copy, name) {
    var layers = copy.layers()
    var newLayers = []
    for(var i = 0; i < layers.length; i++) {
        var layer = layers[i]
        var layerName = [layer name];
        if(layerName == (name+"-synced")) {
            continue;
        }
        newLayers.push(layer)
    }
    [copy setLayers: newLayers]
}

var createNewArtboard = function(master, copy) {
    var newName = [master name] + "-synced";
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
        if([layer className] != "MSArtboardGroup" || [layer name] != newName) {
            [extraLayers addObject: layer]
        }
    }
    [newArtboard addLayers:extraLayers];



    masterItemCopyFrame = [masterItemCopy frame];
    [masterItemCopyFrame setX:0];
    [masterItemCopyFrame setY:0];
    
    [masterItemCopy setName: newName];
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

var dropdown;

var getDropdownValue = function() {
    if(dropdown) {
        return dropdown.titleOfSelectedItem();
    } else {
        return null;
    }
}

var createDropDownWindow = function(context,title,boardNames) {

    var alert = COSAlertWindow.new();

    alert.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("copy.png").path()));
    alert.setMessageText(title)

    // Creating dialog buttons
    alert.addButtonWithTitle("Ok");
    alert.addButtonWithTitle("Cancel");

    // Creating the view
    var viewWidth = 300;
    var viewHeight = 100;

    var view = NSView.alloc().initWithFrame(NSMakeRect(0, 0, viewWidth, viewHeight));
    alert.addAccessoryView(view);

    // Create and configure your inputs here
    // Create label
    var label = NSTextField.alloc().initWithFrame(NSMakeRect(0,viewHeight - 33,(viewWidth - 100),35));
    [label setBezeled:false];
    [label setDrawsBackground:false];
    [label setEditable:false];
    [label setSelectable:false];
    // Add label
    label.setStringValue("Select Artboard:");
    view.addSubview(label);
    
    // Creating the input
    dropdown = NSPopUpButton.alloc().initWithFrame(NSMakeRect(0, viewHeight - 50, (viewWidth / 2), 22));
    var names = boardNames;
    // Filling the PopUpButton with options  
    for(var i = 0; i < names.length; i++) {
        var name = names[i];
        [dropdown addItemWithTitle:name];
    }
    dropdown.selectItemAtIndex(0);
    // Adding the PopUpButton to the dialog
    view.addSubview(dropdown);

    // Show the dialog
    return [alert]
}

var getAllArtboardNames = function(context) {
    let pages = context.document.pages();
    var names = []
    // Filter layers using NSPredicate
    for(var i = 0; i < pages.length; i++) {
        var currentPage = pages[i]
        var scope =  [currentPage children],
		predicate = NSPredicate.predicateWithFormat("(className == %@)", "MSArtboardGroup"),
		layers = [scope filteredArrayUsingPredicate:predicate];
	    var loop = [layers objectEnumerator], layer;
    
	    while (layer = [loop nextObject]) {
		    var nameOfBoard = [layer name]
            if(nameOfBoard.indexOf("-synced") < 0) {
                names.push(nameOfBoard);
            }
            
	    }
    }
	return names;
}