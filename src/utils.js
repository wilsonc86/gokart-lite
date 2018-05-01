import { $ } from 'src/vendor.js'

function Utils() {
}

Utils.prototype.debounce = function (func, wait, immediate) {
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    'use strict'
    var timeout = null
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

//like jquery.extend, but is a deep extend version
Utils.prototype.extend = function() {
    if (arguments.length === 0) {
        return {}
    } else if (arguments.length === 1) {
        return arguments[0]
    } else {
        var o = arguments[0]
        var _arguments = arguments
        var index = 1
        var vm = this
        while (index < arguments.length) {
            $.each(arguments[index],function(key,value) {
                if (key in o) {
                    //key exist in the result object
                    if (value !== null && value !== undefined && typeof(value) === "object" && !Array.isArray(value)) {
                        //is a json object
                        if (o[key] !== null && o[key] !== undefined && typeof(o[key]) === "object" && !Array.isArray(o[key])) {
                            //the same key in result object is a json object
                            o[key] = vm.extend(o[key],value)
                        } else {
                            //the same key in result object is not a json object,overrite it
                            o[key] = value
                        }
                    } else {
                        //is not a json object
                        //overrite it
                        o[key] = value
                    }
                } else {
                    //key does not exist in the result object
                    o[key] = value
                }

            })
            index += 1
        }
        return o
    }
}

Utils.prototype.availWidth = function(element) {
    return $(element).width() - (parseInt($(element).css("padding-left")) || 0) - (parseInt($(element).css("padding-right")) || 0)
}
Utils.prototype.paddingX = function(element) {
    return (parseInt($(element).css("padding-left")) || 0) - (parseInt($(element).css("padding-right")) || 0)
}
Utils.prototype.availHeight = function(element) {
    return $(element).height() - (parseInt($(element).css("padding-top")) || 0) + (parseInt($(element).css("padding-bottom")) || 0)
}
Utils.prototype.paddingY = function(element) {
    return (parseInt($(element).css("padding-top")) || 0) + (parseInt($(element).css("padding-bottom")) || 0)
}
var utils = new Utils()

export default utils
