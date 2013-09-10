var fileSystem;

//generic getById
function getById(id) {
    return document.querySelector(id);
}

//generic content logger
function logit(str) {
    getById("#log").innerHTML += "<p>" + str + "</p>";
}

//generic error handler
function onError(e) {
    alert("Error");
    console.log(e);
}
// ------------------------------------------------------------------------------------------------------------------------
// fuctions
// ------------------------------------------------------------------------------------------------------------------------
function metadataFile(m) {
    logit("==> File was last modified " + m.modificationTime);
}

function readFile(f) {
    f.file(function(e) {
        console.log('==> called the file func on the file ob');

        var reader = new FileReader();
        /* prepare read listeners */
        reader.onloadstart = function() {
            console.log('==> started reading');
        };//onLoadStart
        reader.onabort = function(evt) {
            console.log('==> aborted read text');
            console.log(evt.target.result);
        };//onAbort
        reader.onerror = function(evt) {
            console.log('==> Error read text');
            console.log('==> Error', evt.error.code);
        };//onError
        reader.onloadend = function(evt) {
            console.log("==> evt:");
            console.log(evt);
            var targetRes = evt.target.result;
            console.log("==> targetRes:");
            console.log(targetRes);
            console.log("==> readerRes:");
            console.log(reader.result);
            console.log("==> finish read");
        };//onLoadEnd
        reader.readAsText(e);
    });//fileObj.file()
}

function appendFile(f) {
    var str = "";
    str = "Test at " + new Date().toString() + "\n";
    f.createWriter(function(writerOb) {
        writerOb.onwrite = function() {
            logit("Done writing to file: " + str);
        };
        //go to the end of the file...
        writerOb.seek(writerOb.length);
        writerOb.write(str);
    });
}

function gotFiles(entries) {
    getById("#log").innerHTML = "";
    logit("===== File's: ===");

    var s = "",
        i,
        len;

    for (i = 0, len = entries.length; i < len; i++) {
        //entry objects include: isFile, isDirectory, name, fullPath
        s = entries[i].fullPath;
        if (entries[i].isFile) {
            s = "[F] " + s;
        } else {
            s = "[D] " + s;
        }
        logit(s);
    }
    logit("=================");
}

// ------------------------------------------------------------------------------------------------------------------------
function doDirectoryListing() {
    console.log("==> Funk :|: doDirectoryListing");
    //get a directory reader from our FS
    var dirReader = fileSystem.root.createReader();

    dirReader.readEntries(gotFiles, onError);
}

function doAppendFile() {
    getById("#log").innerHTML = "";
    fileSystem.root.getFile("test.txt", {create: true}, appendFile, onError);
}

function doReadFile() {
    getById("#log").innerHTML = "";
    fileSystem.root.getFile("test.txt", {create: true}, readFile, onError);
}

function doMetadataFile() {
    getById("#log").innerHTML = "";
    fileSystem.root.getFile("test.txt", {create: true}, function(f) {
        f.getMetadata(metadataFile, onError);
    }, onError);
}

function doDeleteFile() {
    //TODO: create:true - create file if not exist!!!
    fileSystem.root.getFile("test.txt", {create: false}, function(f) {
        f.remove(function() {
            console.log("==> File removed");
        });
    }, onError);
}
// ------------------------------------------------------------------------------------------------------------------------
function onFSSuccess(fs) {
    fileSystem = fs;

    getById("#dirListingButton").addEventListener("touchstart", doDirectoryListing);
    getById("#addFileButton").addEventListener("touchstart", doAppendFile);
    getById("#readFileButton").addEventListener("touchstart", doReadFile);
    getById("#metadataFileButton").addEventListener("touchstart", doMetadataFile);
    getById("#deleteFileButton").addEventListener("touchstart", doDeleteFile);

    console.log("==> Got the file system: ", fileSystem.name, " --- ", "root entry name is ", fileSystem.root.name);

    doDirectoryListing();
}
// ------------------------------------------------------------------------------------------------------------------------
function onDeviceReady() {
    console.log("==> DEVICE READY");
    //request the persistent file system
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, onError);
}
function onLoad() {
    document.addEventListener('deviceready', onDeviceReady, false);
}
// ------------------------------------------------------------------------------------------------------------------------








