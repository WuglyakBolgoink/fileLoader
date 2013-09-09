var fileSystem;

function onLoad() {
	document.addEventListener('deviceready', onDeviceReady, false);
}

function onDeviceReady() {
	console.log("DEVICE READY");
	//request the persistent file system
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, onError);
}

//generic getById
function getById(id) {
    return document.querySelector(id);
}
//generic content logger
function logit(s) {
    getById("#content").innerHTML = s;
	console.log(s);
}

//generic error handler
function onError(e) {
	var errNr = e.code;

    getById("#content").innerHTML = "<h2>Error</h2>" + errNr;
	logit("error:");
	logit(e);
}

function doDeleteFile(e) {
    fileSystem.root.getFile("test.txt", {create:false}, function(f) {
        f.remove(function() {
            logit("File removed");
        });
    }, onError);
}

function metadataFile(m) {
    logit("File was last modified "+m.modificationTime);
}

function doMetadataFile(e) {
    fileSystem.root.getFile("test.txt", {create:true}, function(f) {
        f.getMetadata(metadataFile,onError);
    }, onError);
}

function readFile(f) {
    reader = new FileReader();
    reader.onloadend = function(e) {
        console.log("go to end");
        logit("<pre>" + e.target.result + "</pre><p/>");
    }
    reader.readAsText(f);
}

function doReadFile(e) {
    fileSystem.root.getFile("test.txt", {create:true}, readFile, onError);
}

function appendFile(f) {

    f.createWriter(function(writerOb) {
        writerOb.onwrite=function() {
            logit("Done writing to file.<p/>");
        }
        //go to the end of the file...
        writerOb.seek(writerOb.length);
        writerOb.write("Test at "+new Date().toString() + "\n");
    })

}

function doAppendFile(e) {
    fileSystem.root.getFile("test.txt", {create:true}, appendFile, onError);
}

function gotFiles(entries) {
	logit("===== File's: ===");
    var s = "";
    for(var i=0,len=entries.length; i<len; i++) {
        //entry objects include: isFile, isDirectory, name, fullPath
        s = entries[i].fullPath;
        if (entries[i].isFile) {
            s = "[F] " + s;
        }
        else {
            s = "[D] " + s;
        }
        logit(s);
    }
	logit("=================");

}

function doDirectoryListing(e) {
	console.log("Funk :|: doDirectoryListing");
    //get a directory reader from our FS
    var dirReader = fileSystem.root.createReader();

    dirReader.readEntries(gotFiles,onError);        
}

function onFSSuccess(fs) {
    fileSystem = fs;

    getById("#dirListingButton").addEventListener("touchstart",doDirectoryListing);
    getById("#addFileButton").addEventListener("touchstart",doAppendFile);            
    getById("#readFileButton").addEventListener("touchstart",doReadFile);            
    getById("#metadataFileButton").addEventListener("touchstart",doMetadataFile);            
    getById("#deleteFileButton").addEventListener("touchstart",doDeleteFile);
    
    logit( "<p>Got the file system: " + fileSystem.name + "<br/>" + "root entry name is " + fileSystem.root.name + "</p>");

    doDirectoryListing();
} 