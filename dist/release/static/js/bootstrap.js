var loadGokart = function(gokartDomain,gokartOptions,gokartProfile) {
    var scripts = [];
    var cssFiles = [];
    var containerElement = document.getElementById(gokartOptions.containerId)
    if (!containerElement) {
        throw gokartOptions.containerId + " doesn't exist."
    }
    var mapElementId = "gokart_map"
    var mapElement = document.createElement("div")
    mapElement.id = mapElementId
    containerElement.appendChild(mapElement)

    var getStaticUrl = function(url) {
        try {
            if (gokartDomain.indexOf(".dpaw.wa.gov.au") >= 0) { 
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
            var cssFile = document.createElement("link");
            cssFile.type = "text\/css";
            cssFile.rel = "stylesheet";
            cssFile.media = "all";
            cssFile.crossDomain = true;
            cssFile.href = cssFiles[index];

            cssFile.onerror = loadError;
            cssFile.onload = function(){
                if (index < cssFiles.length - 1) {
                    importCssFile(index + 1,)
                } else {
                    importScript(0)
                }

            }
            oHead.appendChild(cssFile);
        }

    })(document.head || document.getElementsByTagName("head")[0]);

    var importScript = (function (oHead) {
        function loadError (oError) {
            throw new URIError("The script " + oError.target.src + " is not accessible.");
        }
        return function (index) {
            var oScript = document.createElement("script");
            oScript.type = "text\/javascript";
            oScript.src = scripts[index];
            oScript.crossDomain = true;
            oScript.onerror = loadError;
            oScript.onload = function(){
                if (index < scripts.length - 1) {
                    importScript(index + 1,)
                } else {
                    //set map element's size
                    $(mapElement).width($(containerElement).width())
                    $(mapElement).height($(containerElement).height())
                    gokart.initialize(mapElementId)
                }

            }
            oHead.appendChild(oScript);
        }

    })(document.head || document.getElementsByTagName("head")[0]);


    cssFiles.push(gokartDomain + "/dist/static/css/style.css?version=" + gokartProfile.dependents.styleMD5)

    var global = (typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : null);
    if (!global || !global.$) {
        scripts.push(getStaticUrl("/static/libs/jquery/3.2.1/jquery.min.js"))
    }

    scripts.push(gokartDomain + "/dist/static/js/" + gokartOptions.app + "-" + gokartProfile.envType + ".env.js?version=" + gokartProfile.dependents.envMD5 ,gokartDomain + "/dist/vendor.js?version=" + gokartProfile.dependents.vendorMD5,gokartDomain + "/dist/sss.js?version=" + gokartProfile.build.md5)

    importCssFile(0)
}

var loadProfile = function() {
    for(var i = 0;i < document.scripts.length;i++) {
        if (document.scripts[i].src.indexOf("/dist/static/js/bootstrap.js") >= 0) {
            gokartDomain = document.scripts[i].src.substring(0,document.scripts[i].src.indexOf("/dist/static/js/bootstrap.js"))
            break;

        }
    }

    if (!gokartDomain) {
        alert( "/dist/static/js/bootstrap.js is not loaded")
        return
    }

    var req = new XMLHttpRequest()
    req.addEventListener("load",function(){
        gokartProfile = JSON.parse(req.response)
        if (gokartProfile.dependents.vendorMD5 != gokartProfile.build.vendorMD5) {
            alert("Application was built based on outdated vendor library, please build application again.")
        } else {
            loadGokart(gokartDomain,gokartOptions,gokartProfile)
        }
    })
    req.addEventListener("error",function(){
        alert("Load gokart failed")
    })
    req.open("GET",gokartDomain + "/profile/" + gokartOptions.app)
    req.responseType = "text"
    req.withCredentials = true
    req.send()
}
if (gokartOptions) {
    if (document.readyState === "complete") {
        loadProfile()
    } else {
        window.addEventListener("load",function(){
            loadProfile()
        })
    }
}
