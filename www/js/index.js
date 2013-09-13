var fileSystem, // file system on Phone
    coreDefault, // content of default JSON core
    coreServer, // content of server JSON core
    appStorage = window.localStorage,
    nDCcoreFile, // URL for local core file on FileSystem or in www-folder
//    appName = "FileLoader.app", // application name
//    default_nDC_coreJSON_FilePath = "file://" + fileSystem.root.fullPath + "../www/js/defaultCore.json"; // default path to defaultCore.json in www-folder on Phone
    default_nDC_coreJSON_FilePath = "js/defaultCore.json"; // default path to defaultCore.json in www-folder on Phone


// fileError message
var fileError = ['NOT_FOUND_ERR', 'SECURITY_ERR', 'ABORT_ERR', 'NOT_READABLE_ERR', 'ENCODING_ERR', 'NO_MODIFICATION_ALLOWED_ERR', 'INVALID_STATE_ERR', 'SYNTAX_ERR',
    'INVALID_MODIFICATION_ERR', 'QUOTA_EXCEEDED_ERR', 'TYPE_MISMATCH_ERR', 'PATH_EXISTS_ERR'];

// return html-element with id == "id"
function getById(id) {
    return document.querySelector(id);
}

// content logger
function logit(str) {
    getById("#content").innerHTML += "<p>" + str + "</p>";
}

function echo(str) {
    console.log(str);
}
function fileErrorMSG(e) {
    alert("Error");
    console.log(fileError[e.code - 1]);
}

/**
 * save path to coreJSON in LocalStorage and update this on App
 * @param path - URL local on App
 */
function savePathToStorage(path) {
    appStorage.setItem('nDC_core_file', path);
    nDCcoreFile = path;
}
// ------------------------------------------------------------------------------------------------------------------------
// fuctions
// ------------------------------------------------------------------------------------------------------------------------
function readFile(f) {
    f.file(function(e) {
        console.log('==> called the file func on the file ob');

        var reader = new FileReader();
        reader.onerror = function(evt) {
            console.log('==> Error read text');
            console.log('==> Error', evt.error.code);
        };//onError
        reader.onloadend = function(evt) {
            var targetRes = evt.target.result;
            console.log("==> targetRes:");
            console.log(targetRes);
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
    echo("===== File's: ===");
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
        echo(s);
    }
    echo("=================");
}

// ------------------------------------------------------------------------------------------------------------------------
function doDirectoryListing() {
    console.log("==> Funk :|: doDirectoryListing");
    //get a directory reader from our FS
    var dirReader = fileSystem.root.createReader();
    dirReader.readEntries(gotFiles, fileErrorMSG);
}

function doAppendFile() {
    getById("#content").innerHTML = "";
    fileSystem.root.getFile("test.txt", {create: true}, appendFile, fileErrorMSG);
}

function doReadFile() {
    getById("#content").innerHTML = "";
    fileSystem.root.getFile("test.txt", {create: true}, readFile, fileErrorMSG);
}

function doDeleteFile() {
    //TODO: create:true - create file if not exist!!!
    fileSystem.root.getFile("test.txt", {create: false}, function(f) {
        f.remove(function() {
            console.log("==> File removed");
        });
    }, fileErrorMSG);
}
// ------------------------------------------------------------------------------------------------------------------------
function onFSSuccess(fs) {
    fileSystem = fs;

    getById("#dirListingButton").addEventListener("touchstart", doDirectoryListing);
    getById("#addFileButton").addEventListener("touchstart", doAppendFile);
    getById("#readFileButton").addEventListener("touchstart", doReadFile);
    getById("#deleteFileButton").addEventListener("touchstart", doDeleteFile);

    console.log("==> Got the file system: ", fileSystem.name, " --- ", "root entry name is ", fileSystem.root.name);

    doDirectoryListing();
}
// ------------------------------------------------------------------------------------------------------------------------
function onDeviceReady() {
    console.log("==> DEVICE READY");
    //request the persistent file system
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, fileErrorMSG);
}

function onLoad() {
    appStorage.clear();
    document.addEventListener('deviceready', onDeviceReady, false);
    // falls wir schon ein Update gemacht haben, lesen wir neuen Pfad für template Ordner aus LocalStorage
    var cfile = appStorage.getItem('nDC_core_file');
    if (cfile) {
        nDCcoreFile = cfile;
    } else {
        nDCcoreFile = default_nDC_coreJSON_FilePath;
    }
    loadDefaultCore(nDCcoreFile);
}
// ------------------------------------------------------------------------------------------------------------------------
// implement JSON.stringify serialization
JSON.stringify = JSON.stringify || function (obj) {
    var t = typeof (obj);
    if (t != "object" || obj === null) {
        // simple data type
        if (t == "string") {
            obj = '"' + obj + '"';
        }
        return String(obj);
    } else {
        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        for (n in obj) {
            v = obj[n];
            t = typeof (v);
            if (t == "string") {
                v = '"' + v + '"';
            }
            else if (t == "object" && v !== null) {
                v = JSON.stringify(v);
            }
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
};


/**
 * open File and return it content, if error function return string "BAD"
 *
 * @param url - local/external
 * @param contentType - text/json/html/jsonp
 * @returns {string} - content
 */
function openFile(url, contentType) {
    echo("open url: " + url);
    var res = "";
    $.ajax({
        async: false,
        url: url,
        type: "GET",
        dataType: contentType,
        error: function (e) {
            res = "BAD" + JSON.stringify(e);
        },
        success: function (result) {
            res = result;
        }
    });//ajax
    return res;
}

function loadDefaultCore(url) {
    var tmp = openFile(url, "json");
    if (tmp != "BAD") {
//        readlocalFile(url);
        coreDefault = tmp;
    } else {
        alert('can not load default template');
    }
}

function loadServerCore(url) {
    var tmp = openFile(url, "json");
    if (tmp != "BAD") {
        coreServer = tmp;
    } else {
        alert('can not load default template');
    }
}

/**
 *
 * @param file - filename
 * @param url - urlname
 * @param index - index of item
 * @param newVersion - new version nummer
 * @param path - path to template
 */
function save2FS(file, url, index, newVersion, path) {
    fileSystem.root.getFile(file, {create: true}, function(f) {
        var str = openFile(url, "text");
        if (str != "BAD") {

            coreDefault.nDC_CORE.pages[index].version = newVersion;
            coreDefault.nDC_CORE.pages[index].path = path;

            f.createWriter(function(writerOb) {
                writerOb.onwriteend = function() {
                    saveJSON("appCore.json", coreDefault);
                };
                writerOb.write(str);
            });
        } // #if
    }, fileErrorMSG);
}

function saveJSON(fileIn, jsonIn) {
    fileSystem.root.getFile(fileIn, {create: true}, function(f) {
        f.createWriter(function(writerOb) {
            writerOb.onwrite = function() {
                var lPath = "file://" + fileSystem.root.fullPath + "/appCore.json";
                savePathToStorage(lPath);
            };
            writerOb.write(JSON.stringify(jsonIn));
        });
    }, fileErrorMSG);
}


/**
 *  compare default Core with server Core,
 *  if server page not equals to app-page, dowload this page from server with URL-link in serverCore.json
 *
 * @param ndcURL - json url
 */
function compareCore(ndcURL) {
    loadDefaultCore(nDCcoreFile);
    loadServerCore(ndcURL);

    if (!coreServer || !coreDefault) {
        return false;
    }

    var i = 0,
        j1 = coreDefault.nDC_CORE.pages,
        j2 = coreServer.nDC_CORE.pages,
        url = "",
        file = "",
        dir = "",
        path = "";

    for (i in j1) {
        if (j1[i].page == j2[i].page && parseFloat(j1[i].version) < parseFloat(j2[i].version)) {
            dir = j2[i].folder;
            file = j2[i].file;
            url = coreServer.nDC_CORE.url + "/" + dir + "/" + file;
            path = "file://" + fileSystem.root.fullPath + "/" + file;
            //save "file" on FileSystem into root-Directory from "URL"
            save2FS(file, url, i, j2[i].version, path);
        } //#if/page
    } //#for/in
}



$(document).on("click", "#loadJSON_default", function() {
//    var tmp = openFile("file://" + fileSystem.root.fullPath + "/" + "page_search.html", "text");
//    var tmp = openFile("http://ae.subsession.net/projects/nDC/lng.json", "json");
//    echo(tmp);
    loadDefaultCore(nDCcoreFile);
    echo(coreDefault);
});

$(document).on("click", "#loadJSON_server", function() {
    loadServerCore('http://ae.subsession.net/projects/nDC/lng.json');
    logit(coreServer);
});

$(document).on("click", "#clearStorage", function() {
    savePathToStorage(default_nDC_coreJSON_FilePath);
    console.log(">>> storage wurde entleert...");
});

function ttt(url) {
    var s =  openFile(url, "text");
    return s;
}

$(document).on("click", "#loadTemplate", function() {
    echo("click loadTemplate:");
    var url = coreDefault.nDC_CORE.pages[1].path + "/" + coreDefault.nDC_CORE.pages[1].file;
    var t = ttt(url);
    echo(url);
    echo(t);
    logit(t);
});



$(document).on("click", "#compareJSON", function() {
    compareCore('http://ae.subsession.net/projects/nDC/lng.json');
}); // $(document).on("click", "#compareJSON"
