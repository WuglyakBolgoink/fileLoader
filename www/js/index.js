//-----------------
var fileSystem, // file system on Phone
    coreDefault, // content of default JSON core
    coreServer, // content of server JSON core
    appStorage = window.localStorage,
//    nDCcoreFile, // URL for local core file on FileSystem or in www-folder
//    appName = "FileLoader.app", // application name
//    default_nDC_coreJSON_FilePath = "file://" + fileSystem.root.fullPath + "../www/js/defaultCore.json"; // default path to defaultCore.json in www-folder on Phone
    DEFAULT_CORE_PATH = "js/defaultCore.json"; // default path to defaultCore.json in www-folder on Phone

//-----------------
var AppCore = {
    core: DEFAULT_CORE_PATH // URL for local core file on FileSystem or in www-folder
};

var CorePages = Backbone.Model.extend({
    defaults: {
        "page":     "",
        "folder":   "",
        "file":     "",
        "version":  "",
        "path":     ""
    }
});


var CorePagesList = Backbone.Collection.extend({
    link: "",
    model: CorePages,
    compare: function(otherCollection) {
        console.log(":::compare:::");
        console.log(otherCollection);
    },
    getPage: function(name) {
        var item = this.findWhere({"page": name});
        if (item) {
            return item;
        }
    },
    getTemplate: function(name) {
        var item = this.getPage(name).toJSON(),
            url = "";

        if (item) {
            if (item.path) {
                return xxLoadTemplate(item.path);
            }
        } else {
            return 'BAD';
        }
    },
    changeValue: function(pageName, itemValue, itemKey) {
        this.getPage(pageName).set(itemKey, itemValue);
    },
    compareCore: function(other) {
        var input = this.toJSON(),
            output = other.toJSON(),
            i,
            file = "",
            url = "",
            path = "",
            isSave = "";

        for (i = 0; i < input.length; i++) {
            if (input[i].page == output[i].page && parseFloat(input[i].version) < parseFloat(output[i].version)) {
                file = output[i].file;
                url  = other.link + "/" + output[i].folder + "/" + file;
                path = "file://" + fileSystem.root.fullPath + "/" + file;

                isSave = xxSave2FS(this, output[i].version, input[i].page, file, url, path);

            }
        }//for

    }//compareCore
});




var cDefault = new CorePagesList(),
    cServer = new CorePagesList();


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
function saveCorePathToStorage(path) {
    appStorage.setItem('nDC_core_file', path);
    AppCore.core = path;
    loadDefaultCore(path); // reload Core
}
// ------------------------------------------------------------------------------------------------------------------------
// fuctions
// ------------------------------------------------------------------------------------------------------------------------

/**
 * ersetzt defaultCore-file mit default Wert
 * und lädt diese Datei
 */
function clearStorage() {
    saveCorePathToStorage(DEFAULT_CORE_PATH);
    console.log(">>> loaded default storage...");
}

function readFile(f) {
    f.file(function(e) {
        console.log('==> called the file fuqnc on the file ob');

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
    getById("#readFileButton").addEventListener("touchstart", doReadFile);
    getById("#deleteFileButton").addEventListener("touchstart", doDeleteFile);

    console.log("==> Got the file system: ", fileSystem.name, " --- ", "root entry name is ", fileSystem.root.name);

    doDirectoryListing();
}
// ------------------------------------------------------------------------------------------------------------------------
function onDeviceReady() {
    console.log(">>> DEVICE READY");
    //request the persistent file system
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, fileErrorMSG);



    // falls wir schon ein Update gemacht haben, lesen wir neuen Pfad für Core.json aus LocalStorage
    console.log(">>> old default Core: " + AppCore.core);
    var cfile = appStorage.getItem('nDC_core_file');
    if (cfile) {
        AppCore.core = cfile;
    } else {
        AppCore.core = DEFAULT_CORE_PATH;
    }
    console.log(">>> new default Core: " + AppCore.core);


    xxLoadDefaultCore(AppCore.core);

    //TODO: remove
    loadServerCore('http://ae.subsession.net/projects/nDC/lng.json');

//    console.log(cDefault);
//    console.log(cDefault.getPage("main"));
//    console.log(cDefault.getTemplate("login"));
//    cDefault.changeVersion("login", "100");



    cDefault.compareCore(cServer);



//    console.log(">>>>>>>>>>>>>>>>>>>>>>");
//    var d = new CorePagesList();
//    var n = new CorePagesList();
//    d.add({page:"page0",path:"path0",file:"file0"});
//    n.add({page:"page1",path:"path1",file:"file1"},{page:"page2",path:"path2",file:"file2"},{page:"page3",path:"path3",file:"file3"});
//    console.log(d);
//    console.log(n);
//    d.compare(n);
//    console.log(">>>>>>>>>>>>>>>>>>>>>>");
}

function onLoad() {
    document.addEventListener('deviceready', onDeviceReady, false);
}
// ------------------------------------------------------------------------------------------------------------------------
/**
 * open synchron File and return it content,
 * if it doesn't work function return String "BAD"
 *
 * @param url - string local/external
 * @param contentType - text/json/html/jsonp
 * @returns {string} - file content
 */
function xxOpenFile(url, contentType) {
    var res = "BAD";
    $.ajax({
        async: false,
        url: url,
        type: "GET",
        dataType: contentType,
        error: function() {
            res = "BAD";
        },
        success: function(result) {
            res = result;
        }
    });//ajax
    return res;
}

/**
 * load defaultCore from URL,
 * if can not load from URL, load from defaultCore
 *
 * @param url - string
 */
function xxLoadDefaultCore(url) {

    var tmp = xxOpenFile(url, "json");
    if (tmp != "BAD") {
        if (tmp) {
            cDefault.add(tmp);
        }
        coreDefault = tmp;
    } else {
        xxLoadDefaultCore(DEFAULT_CORE_PATH);
    }
}

function loadServerCore(url) {
    var tmp = xxOpenFile(url, "json");
    if (tmp != "BAD") {
        if (tmp.nDC_CORE) {
            cServer.add(tmp.nDC_CORE.pages);
            cServer.link = tmp.nDC_CORE.url;
        }
        coreServer = tmp;
    } else {
        alert('can not load default template');
    }
}


/**
 * Save actual core into App root-folder in file appCore.json.
 *
 * @param thisObj - CorePagesList Object
 * @param newVersion - float
 * @param pageName - string
 * @param file - string
 * @param url - string
 * @param path - string
 * @returns {string} {OK/BAD}
 */
function xxSave2FS(thisObj, newVersion, pageName, file, url, path) {
    var out = "BAD",
        str = xxOpenFile(url, "text");

    if (str != "BAD") {

        fileSystem.root.getFile(file, {create: true}, function(f) {

            thisObj.changeValue(pageName, newVersion, "version");
            thisObj.changeValue(pageName, path, "path");

            f.createWriter(function(writerOb) {
                writerOb.onwriteend = function() {
                    xxSaveJSON("appCore.json", cDefault);
                };
                writerOb.write(str);
            });
        }, fileErrorMSG);

        out = "OK";
    }

    return out;
}

function xxSaveJSON(fileIn, jsonIn) {
    fileSystem.root.getFile(fileIn, {create: true}, function(f) {
        f.createWriter(function(writerObj) {
            writerObj.onwrite = function() {
                var lPath = "file://" + fileSystem.root.fullPath + "/appCore.json";
                saveCorePathToStorage(lPath);
            };
            writerObj.write(JSON.stringify(jsonIn));
        });
    }, fileErrorMSG);
}









$(document).on("click", "#clearStorage", function() {
    clearStorage();
});


function xxLoadTemplate(url) {
    var res = "BAD";
    $.ajax({
        async: false,
        url: url,
        type: "GET",
        dataType: "text",
        error: function (e) {
            res = "BAD";
        },
        success: function (result) {
            res = result;
        }
    });//ajax
    return res;
}


