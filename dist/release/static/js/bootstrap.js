//envType can be local, dev, uat and prod.default is prod
var loadGokart = function(options) {
    options.envType = options.envType || "prod"
    var gokartDomain = null;
    var scripts = [];
    var cssFiles = [];

    var containerElement = document.getElementById(options.containerId)
    if (!containerElement) {
        throw options.containerId + " is not found."
    }
    var mapElementId = "gokart_map"
    var mapElement = document.createElement("div")
    mapElement.id = mapElementId
    containerElement.appendChild(mapElement)

    for(var i = 0;i < document.scripts.length;i++) {
        if (document.scripts[i].src.indexOf("/dist/static/js/bootstrap.js") >= 0) {
            gokartDomain = document.scripts[i].src.substring(0,document.scripts[i].src.indexOf("/dist/static/js/bootstrap.js"))
            break;

        }
    }

    if (!gokartDomain) {
        throw "/dist/static/js/bootstrap.js is not loaded"
    }

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
                    console.log("End to load css file")
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
                    console.log("End to load Gokart lite")
                    //set map element's size
                    $(mapElement).width($(containerElement).width())
                    $(mapElement).height($(containerElement).height())
                    gokart.map = new gokart.Map(mapElementId)
                }

            }
            oHead.appendChild(oScript);
        }

    })(document.head || document.getElementsByTagName("head")[0]);


    cssFiles.push(gokartDomain + "/dist/static/css/style.css")

    var global = (typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : null);
    if (!global || !global.$) {
        scripts.push(getStaticUrl("/static/libs/jquery/3.2.1/jquery.min.js"))
    }

    scripts.push(gokartDomain + "/dist/static/js/" + options.app + "-" + options.envType + ".env.js" ,gokartDomain + "/dist/vendor.js",gokartDomain + "/dist/sss.js")

    importCssFile(0)

}
if (gokartOptions) {
    if (document.readyState === "complete") {
        loadGokart(gokartOptions)
    } else {
        window.addEventListener("load",function(){
            loadGokart(gokartOptions)
        })
    }
}
