function isScriptIncluded(src) {
    var scripts = document.getElementsByTagName("script");
    for(var i = 0; i < scripts.length; i++)
       if(scripts[i].getAttribute('src') === src) return true;
    return false;
}
function isCssIncluded(src) {
    var links = document.getElementsByTagName("link");
    for(var i = 0; i < links.length; i++)
       if(links[i].getAttribute('href') === src) return true;
    return false;
}

var loadGokartApp = function(gokartService,appOptions,gokartProfile,successCallback) {
    var scripts = [];
    var cssFiles = [];

    var containerElement = document.getElementById(appOptions["containerId"])
    if (!containerElement) {
        throw appOptions["containerId"] + " doesn't exist."
    }
    var mapElementId = "gokart_" + appOptions["app"] + "_map"
    var mapElement = document.createElement("div")
    mapElement.id = mapElementId
    containerElement.appendChild(mapElement)

    var getStaticUrl = function(url) {
        try {
            if (gokartService.indexOf(".dpaw.wa.gov.au") >= 0) { 
                return "https://static.dpaw.wa.gov.au" + url
            } else {
                return "https://static.dbca.wa.gov.au" + url
            }
        } catch(ex) {
            return "https://static.dpaw.wa.gov.au" + url
        }
    }

    var importCssFile = (function (oHead) {
        function loadError (oError) {
            throw new URIError("The css " + oError.target.src + " is not accessible.");
        }
        return function (index) {
            var postLoad = function(){
                if (index < cssFiles.length - 1) {
                    importCssFile(index + 1,)
                } else {
                    importScript(0)
                }

            }
            if (isCssIncluded(cssFiles[index])) {
                //already loaded:
                postLoad()
                return
            }
            //console.log("load css file: " + cssFiles[index])
            var cssFile = document.createElement("link");
            cssFile.type = "text\/css";
            cssFile.rel = "stylesheet";
            cssFile.media = "all";
            cssFile.crossDomain = true;
            cssFile.href = cssFiles[index];

            cssFile.onerror = loadError;
            cssFile.onload = postLoad
            oHead.appendChild(cssFile);
        }

    })(document.head || document.getElementsByTagName("head")[0]);

    var importScript = (function (oHead) {
        function loadError (oError) {
            throw new URIError("The script " + oError.target.src + " is not accessible.");
        }
        return function (index) {
            var postLoad = function(){
                if (index < scripts.length - 1) {
                    importScript(index + 1,)
                } else {
                    //set map element's size
                    $(mapElement).width($(containerElement).width())
                    $(mapElement).height($(containerElement).height())
                    var name = "gokart_" + appOptions["app"]
                    if (appOptions["name"]) {
                        name = appOptions["name"]
                    } else {
                        name = "gokart_" + appOptions["app"]
                    }
                    eval("window." + name + "= new Gokart(\"" + appOptions["app"] + "\",mapElementId,true)")
                    if (successCallback) {
                        successCallback()
                    }
                }

            }
            if (isScriptIncluded(scripts[index])) {
                //already loaded:
                postLoad()
                return
            }
            //console.log("load javascript file: " + scripts[index])
            var oScript = document.createElement("script");
            oScript.type = "text\/javascript";
            oScript.src = scripts[index];
            oScript.crossDomain = true;
            oScript.onerror = loadError;
            oScript.onload = postLoad
            oHead.appendChild(oScript);
        }

    })(document.head || document.getElementsByTagName("head")[0]);


    cssFiles.push(gokartService + "/dist/static/css/style.css?version=" + gokartProfile.dependents.styleMD5)

    var global = (typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : null);
    if (!global || !global.$) {
        scripts.push(getStaticUrl("/static/libs/jquery/3.2.1/jquery.min.js"))
    }

    scripts.push(gokartService + "/dist/static/js/" + appOptions["app"] + "-" + gokartProfile.envType + ".env.js?version=" + gokartProfile.dependents.envMD5 ,gokartService + "/dist/vendor.js?version=" + gokartProfile.dependents.vendorMD5,gokartService + "/dist/sss.js?version=" + gokartProfile.build.md5)

    importCssFile(0)
}

var loadProfile = function(gokartOptions) {
    var gokartService = null
    var gokartProfile = null
    for(var i = 0;i < document.scripts.length;i++) {
        if (document.scripts[i].src.indexOf("/dist/static/js/bootstrap.js") >= 0) {
            gokartService = document.scripts[i].src.substring(0,document.scripts[i].src.indexOf("/dist/static/js/bootstrap.js"))
            break;

        }
    }

    if (!gokartService) {
        alert( "/dist/static/js/bootstrap.js is not loaded")
        return
    }
    var loadApp = function(appOptions,callback) {
        if (!("app" in appOptions && "containerId" in appOptions)) {
            if (callback) {
                callback()
            }
            return
        }
        //console.log("Begin to load gokart app (" + appOptions["app"] + ")")
        var req = new XMLHttpRequest()
        req.addEventListener("load",function(){
      	    gokartProfile = JSON.parse(req.response)
            if (gokartProfile.dependents.vendorMD5 != gokartProfile.build.vendorMD5) {
                alert("Application was built based on outdated vendor library, please build application again.")
            } else  {
                loadGokartApp(gokartService,appOptions,gokartProfile,callback)
            }
        })
        req.addEventListener("error",function(){
            alert("Load gokart app(" + appOptions["app"] + ") failed")
        })
        req.open("GET",gokartService + "/profile/" + appOptions["app"])
        req.responseType = "text"
        req.withCredentials = true
        req.send()
    }
    if (Array.isArray(gokartOptions)) {
        var loadApps = function(index) {
            if (index >= gokartOptions.length) {
                return
            }
            loadApp(gokartOptions[index],function(){
                if (index < gokartOptions.length - 1) {
                    loadApps(index + 1)
                }
            })
        }
        loadApps(0)
    } else if ("app" in gokartOptions && "containerId" in gokartOptions) {
        if (!("name" in gokartOptions)) {
            gokartOptions["name"] = "gokart"
        }
        loadApp(gokartOptions)
    } else {
        alert("'app' or 'containerId' are missing in gokartOptions")
    }
}
if (gokartOptions) {
    if (document.readyState === "complete") {
        loadProfile(gokartOptions)
    } else {
        window.addEventListener("load",function(){
            loadProfile(gokartOptions)
        })
    }
}
