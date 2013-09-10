// ------------------------------------------------------------------------------------------------------------------------
var fileSystem, // file system on Phone
//    coreDefault, // content of default JSON core
//    coreServer, // content of server JSON core
    appStorage = window.localStorage,
    DEFAULT_CORE_PATH = "js/defaultCore.json"; // default path to defaultCore.json in www-folder on Phone
// ------------------------------------------------------------------------------------------------------------------------
// fileError message
var fileError = ['NOT_FOUND_ERR', 'SECURITY_ERR', 'ABORT_ERR', 'NOT_READABLE_ERR', 'ENCODING_ERR', 'NO_MODIFICATION_ALLOWED_ERR', 'INVALID_STATE_ERR', 'SYNTAX_ERR',
    'INVALID_MODIFICATION_ERR', 'QUOTA_EXCEEDED_ERR', 'TYPE_MISMATCH_ERR', 'PATH_EXISTS_ERR'];
// ------------------------------------------------------------------------------------------------------------------------
// core
var AppCore = {
    core: DEFAULT_CORE_PATH // URL for local core file on FileSystem or in www-folder
};

// Model: CorePages - page item
var CorePages = Backbone.Model.extend({
    defaults: {
        "page":     "",
        "folder":   "",
        "file":     "",
        "version":  "",
        "path":     ""
    }
});

// Colelction: CorePagesList - list of core pages
var CorePagesList = Backbone.Collection.extend({
    link: "",
    model: CorePages,
    getPage: function(name) { /* get page item / json / */
        var item = this.findWhere({"page": name});
        if (item) {
            return item;
        }
    },
    getTemplate: function(name) { /* open template from url / text / */
        var item = this.getPage(name).toJSON();

        if (item) {
            if (item.path) {
//                return xxLoadTemplate(item.path);
                return xxOpenFile(item.path, "text");
            }
        } else {
            return 'BAD';
        }
    },
    changeValue: function(pageName, itemValue, itemKey) { /* change value of key for item with pageName */
        this.getPage(pageName).set(itemKey, itemValue);
    },
    compareCore: function(other) { /* compare 2 core */
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

                // save changes into file system
                isSave = xxSave2FS(this, output[i].version, input[i].page, file, url, path);
            }
        }//for

    }//compareCore
});
// ------------------------------------------------------------------------------------------------------------------------
var cDefault = new CorePagesList(),
    cServer = new CorePagesList();
// ------------------------------------------------------------------------------------------------------------------------
function fileErrorMSG(e) {
    alert("Error");
    console.log(fileError[e.code - 1]);
}
// ------------------------------------------------------------------------------------------------------------------------
/**
 * change defaultCore-file with default value and load this file.
 * save path to coreJSON in LocalStorage and update this on App.
 */
function clearStorage() {
    var defaultPathURL = DEFAULT_CORE_PATH;
    appStorage.setItem('nDC_core_file', defaultPathURL);
    AppCore.core = defaultPathURL;
    xxLoadDefaultCore(defaultPathURL); // reload Core
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
// ------------------------------------------------------------------------------------------------------------------------
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
//        coreDefault = tmp;
    } else {
        xxLoadDefaultCore(DEFAULT_CORE_PATH);
    }
}
// ------------------------------------------------------------------------------------------------------------------------
/**
 * load core from server
 *
 * @param url
 */
//TODO: return BackBone Collection Object!!!
function xxLoadServerCore(url) {
    var tmp = xxOpenFile(url, "json");
    if (tmp != "BAD") {
        if (tmp.nDC_CORE) {
            cServer.add(tmp.nDC_CORE.pages);
            cServer.link = tmp.nDC_CORE.url;
        }
//        coreServer = tmp;
    } else {
        alert('can not load default template');
    }
}
// ------------------------------------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------------------------------------
function onDeviceReady() {
    console.log(">>> DEVICE READY");
    //request the persistent file system
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
        fileSystem = fs;
        console.log("==> Got the file system: ", fileSystem.name, " --- ", "root entry name is ", fileSystem.root.name);
    }, fileErrorMSG);

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
    xxLoadServerCore('http://ae.subsession.net/projects/nDC/lng.json');

//    console.log(cDefault);
//    console.log(cDefault.getPage("main"));
//    console.log(cDefault.getTemplate("login"));
//    cDefault.changeVersion("login", "100");
    cDefault.compareCore(cServer);
}//onDeviceReady()
// ------------------------------------------------------------------------------------------------------------------------
function onLoad() {
    document.addEventListener('deviceready', onDeviceReady, false);
}//onLoad()
// ------------------------------------------------------------------------------------------------------------------------
$(document).on("click", "#clearStorage", function() {
    clearStorage();
});
