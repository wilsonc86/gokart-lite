import Map from './components/map.js'
import {getCRS} from './components/crs.js'
import {Layer} from './components/layer.js'
import {utils} from 'src/vendor.js'

var Gokart = function(app,mapid,embeded) {
    //initialize env
    this.env = eval(app + "Env")
    if (typeof gokartOptions !== 'undefined') {
        if (Array.isArray(gokartOptions)) {
            var options = gokartOptions.find(function(o) {return o["app"] === app})
            if (options) {
                this.env = utils.extend(this.env,options)   
            }
        } else if (gokartOptions["app"] === app) {
            this.env = utils.extend(this.env,gokartOptions)   
        } else if (!("app" in gokartOptions)) {
            this.env = utils.extend(this.env,gokartOptions)   
        }
    }
    this.env["app"] = app
    this.env["mapid"] = mapid
    this.embeded = embeded?true:false

    var vm = this
    $.each([["publicWmtsService","wmtsService"],["publicWmsService","wmsService"],["publicWfsService","wfsService"]],function(index,config){
        if (!vm.env[config[0]]) {
            vm.env[config[0]] = vm.env[config[1]]
        }
    })
    
    //try to authenticate user
    $.ajax({
        url: this.env["whoamiUrl"],
        method:"GET",
        dataType:"json",
        success: function (response, stat, xhr) {
            vm.user = response
            vm.user["authenticated"] = vm.user["session_key"]?true:false
            //create leaflet map
            vm.map = new Gokart.Map(vm)
        },
        error: function (xhr,status,message) {
            vm.user = {authenticated:false}
            //create leaflet map
            vm.map = new Gokart.Map(vm)
        },
        xhrFields: {
          withCredentials: true
        }
    })
}

Gokart.prototype.isAuthenticated = function() {
    return (this.user && this.user["authenticated"])?true:false
}

Gokart.Map = Map;
Gokart.Layer = Layer;
Gokart.getCRS = getCRS;
Gokart.utils = utils;

export  default Gokart
