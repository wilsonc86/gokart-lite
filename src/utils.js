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
//1 based
Utils.prototype.dayOfYear = function(d) {
    d = d || new Date()
    var yearFirstDay = new Date(d.getFullYear(),0,1)
    return Math.ceil(((d - yearFirstDay) + 1)/86400000)
}

Utils.prototype.getNextDatetime = function(interval,intervalUnit,datetime) {
    interval = interval || 1
    if (interval < 0 || Math.floor(interval) !== interval) {
        throw "Interval should be positive integer"
    }
    datetime = datetime ||  new Date()
    if (intervalUnit === 'day') {
        if (interval === 1) {
            return new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate() + 1)
        } else {
            var dayOfYear = this.dayOfYear(datetime) - 1 //change it to 0 based
            var d = null
            if (dayOfYear % interval === 0) {
                d = new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate() + interval)
            } else {
                d = new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate() + (interval - dayOfYear % interval))
            }
            if (d.getFullYear() !== datetime.getFullYear()) {
                //move to the next year,change it to the next year's first day
                d = new Date(datetime.getFullYear() + 1,0,1)
            }
            return d
        }
    } else if (intervalUnit === "hour") {
        if (interval === 1) {
            return new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate() ,datetime.getHours() + 1)
        } else {
            var hours = datetime.getHours() //0 based
            var d = null
            if (hours % interval === 0) {
                d = new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate(),datetime.getHours() + interval)
            } else {
                d = new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate(),datetime.getHours() + (interval - hours % interval))
            }
            if (d.getDate() !== datetime.getDate()) {
                //move to the next date,change it to the start of the next date
                d = new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate() + 1)
            }
            return d
        }
    } else if (intervalUnit === "minute") {
        if (interval === 1) {
            return new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate() ,datetime.getHours(),datetime.getMinutes() + 1)
        } else {
            var minutes = datetime.getMinutes() //0 based
            var d = null
            if (minutes % interval === 0) {
                d = new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate(),datetime.getHours(),datetime.getMinutes() + interval)
            } else {
                d = new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate(),datetime.getHours(),datetime.getMinutes() + (interval - minutes % interval))
            }
            if (d.getHours() !== datetime.getHours()) {
                //move to the next Hour,change it to the start of the next hour
                d = new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate(),datetime.getHours() + 1)
            }
            return d
        }
    } else {
        throw "Interval unit '" + intervalUnit + "' Not Support"
    }
}
var utils = new Utils()

export default utils
