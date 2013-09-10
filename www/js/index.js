var fileSystem,
    coreDefault,
    coreServer,
    appStorage = window.localStorage,
    nDCcoreFile;


//TODO: error message test
var fileError = ['NOT_FOUND_ERR', 'SECURITY_ERR', 'ABORT_ERR', 'NOT_READABLE_ERR', 'ENCODING_ERR', 'NO_MODIFICATION_ALLOWED_ERR', 'INVALID_STATE_ERR', 'SYNTAX_ERR',
    'INVALID_MODIFICATION_ERR', 'QUOTA_EXCEEDED_ERR', 'TYPE_MISMATCH_ERR', 'PATH_EXISTS_ERR'];

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
    console.log(JSON.stringify(e));
}
//generic error handler
function onErrorDelete(e) {
    alert("Error");
    console.log(JSON.stringify(e));
    console.log(fileError[e.code - 1]);
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
    console.log("===== File's: ===");

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
        console.log(s);
    }
    logit("=================");
    console.log("=================");
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
    }, onErrorDelete);
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
    // falls wir schon ein Update gemacht haben, lesen wir neuen Pfad für template Ordner aus LocalStorage
    var cfile = appStorage.getItem('nDC_core_file');
    if (cfile) {
        nDCcoreFile = cfile;
    } else {
        nDCcoreFile = "./js/defaultCore.json";
    }
}
// ------------------------------------------------------------------------------------------------------------------------
function getJSON(url) {
    var res;
    $.ajax({
        async: false,
        url: url,
        type: "GET",
        dataType: 'json',
        error: function (err) {
            alert("coreERROR: network error!");
            console.log(err);
        },
        success: function (result) {
            if (result.nDC_CORE) {
                res = result.nDC_CORE;
            } else {
                alert("coreERROR: nDC_CORE not found!");
            }
        }
    });//ajax

    return res;
}

$(document).on("click", "#loadJSON_default", function() {
    console.log("versuche öffnen:", nDCcoreFile);
    if (nDCcoreFile) {
        coreDefault = getJSON(nDCcoreFile);
    } else {
        alert('can not load default template');
    }
    console.log('coreDefault loaded');
});

$(document).on("click", "#loadJSON_server", function() {
    coreServer = getJSON('http://ae.subsession.net/projects/nDC/lng.json');
    console.log('coreServer loaded');
});


function onErrorSAVE2FS(e) {
    console.log('>>> Error:', fileError[e.code - 1]);
}
function getTemplate(url) {
    var res;
    $.ajax({
        async: false,
        url: url,
        type: "GET",
        dataType: 'html',
        error: function (err) {
            console.log("templateERROR: network error!");
            console.log(err);
            res = 'BAD';
        },
        success: function (result) {
            if (result) {
                res = result;
            } else {
                console.log("templateERROR: file not found!");
                res = 'BAD';
            }
        }
    });//ajax

    return res;
}
/**
 *
 * @param file
 * @param dir
 * @param url
 * @returns {boolean}
 */
function save2FS(file, url) {
    var status = true;
    fileSystem.root.getFile(file, {create: true}, function(f) {
        var str = "";
        str = getTemplate(url);
        if (str == "BAD") {
            return false;
        }
        f.createWriter(function(writerOb) {
            writerOb.onwrite = function() {
//                console.log("Done writing to file: ", str);
                console.log(">>> Done writing to file: ", file);
            };
//        go to the end of the file...
//        writerOb.seek(writerOb.length);
            writerOb.write(str);
        });
    }, onErrorSAVE2FS);
    return status;
}

function saveJSON(fileIn, jsonIn) {
    var status = true;
    fileSystem.root.getFile(fileIn, {create: true}, function(f) {
        f.createWriter(function(writerOb) {
            writerOb.onwrite = function() {
                console.log(">>> Done writing to file: ", fileIn);
            };
            writerOb.write(JSON.stringify(jsonIn));
        });
    }, onErrorSAVE2FS);
    return status;
}
$(document).on("click", "#compareJSON", function() {
    console.log('================================================');
    console.log('== compare jSON:');
    console.log('================================================');
    if (!coreServer || !coreDefault) {
        console.log("== nothing to compare");
        console.log('================================================');
        return false;
    }
//    console.log('== default');
//    console.log(coreDefault);
//    console.log('================================================');
//    console.log('== from server');
//    console.log(coreServer);
//    console.log('================================================');
    var i = 0,
        j1 = coreDefault.pages,
        j2 = coreServer.pages,
        url = "",
        file = "",
        dir = "",
        res;

    for (i in j1) {
        if (j1[i].page == j2[i].page && parseFloat(j1[i].version) < parseFloat(j2[i].version)) {
            console.log(">>> Item", j1[i].page, "with version ", j1[i].version, "has new version", j2[i].version);

            url = coreServer.url + "/" + j2[i].folder + "/" + j2[i].file;
            dir = j2[i].folder;
            file = j2[i].file;

            //save "file" on FileSystem into Directory "dir" from "URL"
            //TODO: prüfen ob DIR existiert; falls nein dann erstellen wir die
//            res = save2FS(dir + '/' + file, url);
            res = save2FS(file, url);
            if (res) {
                console.log("successfull saved file:", file, "into", dir, "from", url);
                //TODO: test
                j1[i].version = j2[i].version;

                res = saveJSON('appCore.json', coreDefault);
                if (res) {
                    console.log("successfull saved file into:");
                    var path = fileSystem.root.fullPath + '/' + 'appCore.json';
                    console.log(path);
                    appStorage.setItem('nDC_core_file', path);
                }
            }
        }
    }//#for

//    console.log(coreDefault);
//    console.log(coreServer);

    console.log('================================================');
});



