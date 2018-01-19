import { $ } from 'src/vendor.js'

function Utils() {
}

var styleVersion = null;
function _checkVersion(app,profile,check) {
    $.ajax({
        url: gokartEnv.gokartService + "/profile/" + app + "/" + profile.distributionType,
        method:"GET",
        contentType:"application/json",
        success: function (response, stat, xhr) {
            if (profile.build.datetime !== response.build.datetime || 
                profile.build.host !== response.build.host || 
                profile.build.platform !== response.build.platform
            ) {
                alert("New version is available, please press <F5> to reload the system; if can't fix, please clean browser's cache.")
            } else if (profile.build.vendorMD5 !== response.build.vendorMD5) {
                alert("Application was not built on the latest vendor library, please rebuild the application again.")
            } else if (!("envVersion" in response) && "envType" in response) {
                alert("The '" + response.envType + "' enviroment file is missing in the server side. ")
            } else if ("envType" in response && response.envType !== gokartEnv.envType) {
                alert("Local environment '" + gokartEnv.envType + "' does not match the server configured enviroment '" + response.envType + "', please press <F5> to reload the system; if can't fix, please clean borwser's cache." )
            } else if ("envVersion" in response && (response.envVersion || "").trim() !== (gokartEnv.envVersion || "").trim() ) {
                alert("The running environment is changed, please press <F5> to reload the system; if can't fix, please clean browser's cache.")
            } else if (styleVersion && "styleVersion" in response && (response.styleVersion || "").trim() !== styleVersion) {
                alert("The style file is changed, please press <F5> to reload the system; if can't fix, please clean browser's cache.")
            } else if (check) {
                alert("You have the latest version.")
            }
        },
        error: function (xhr,status,message) {
            alert(xhr.status + " : " + (xhr.responseText || message))
        },
        xhrFields: {
            withCredentials: true
        }
    })
}

Utils.prototype.checkVersion = function(app,profile,check) {
    try {
        if (styleVersion === null && new URL(gokartEnv.gokartService).host === document.location.host) {
            $.ajax({
                url: gokartEnv.gokartService + "/dist/static/css/style.css",
                method:"GET",
                contentType:"text/plain",
                success: function (response, stat, xhr) {
                    var styleVersion_re = /\/\*\s*version\s*:\s*[\"\']?\s*([a-zA-Z0-9\.\:\-][a-zA-Z0-9\.\:\-\ ]+[a-zA-Z0-9\.\:\-])\s*[\"\']?\s*\*\//
                    var m = styleVersion_re.exec(response)
                    styleVersion = m?m[1].trim():""
                    _checkVersion(app,profile,check)
                },
                error: function (xhr,status,message) {
                    alert(xhr.status + " : " + (xhr.responseText || message))
                },
                xhrFields: {
                    withCredentials: true
                }
            })
        } else {
            _checkVersion(app,profile,check)
        }
    } catch(ex) {
        _checkVersion(app,profile,check)
    }
}

Utils.prototype.debounce = function (func, wait, immediate) {
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    'use strict'
    var timeout
    return function () {
        var context = this
        var args = arguments
        var later = function () {
            timeout = null
            if (!immediate) func.apply(context, args)
        }
        var callNow = immediate && !timeout
        clearTimeout(timeout)
        timeout = setTimeout(later, (context && context.wait) || wait)
        if (callNow) func.apply(context, args)
    }
}

var utils = new Utils()

export default utils
