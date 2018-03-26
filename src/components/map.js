import {
  $,
  L
} from 'src/vendor.js'

import {Layer} from './layer.js'
import {getCRS} from './crs.js'
import {FeatureInfo} from './interactions.js'

var Map = function (mapid,user) {
    this._user = user || {authenticated:false}
    this._mapid = mapid
    this._mapElement = $("#" + mapid)
    this._options = gokartEnv["map"] || {}
    if ("crs" in this._options && typeof(this._options["crs"]) === "string") {
        this._options["crs"] = getCRS(this._options["crs"])
    }

    var vm = this
    //convert bounds array to latLngBounds
    $.each(["bounds","maxBounds"],function(index,key) {
        if (key in vm._options && Array.isArray(vm._options[key])) {
            vm._options[key] = L.latLngBounds(
                L.latLng(vm._options[key][0][0],vm._options[key][0][1]),
                L.latLng(vm._options[key][1][0],vm._options[key][1][1])
            )
        }
    })
    this._map = null
    
    this._embeded = new URL(gokartEnv.gokartService).host !== document.location.host
    this._create()
}
//set map option
//parameters:key,value
Map.prototype.setOption = function(key,value,enforce) {
    if (key === "crs" && typeof(value) === "string") {
        value = getCRS(value)
    } else if (key === "maxBounds" && Array.isArray(value)) {
        value = L.latLngBounds(L.latLng(value[0],L.latLng(value[1])))
    } else if(key === "fullpageControl") {
        if (!this._embeded) {
            //fullpage control is not supported in non embeded environment
            return
        }
    } else if (!enforce && this._options[key] === value) {
        return
    }

    this._options[key] = value
    if (!this._map) return

    if (key === "center") {
        this._map.setView(value)
    } else if(key === "zoom") {
        this._map.setZoom(value)
    } else if(key === "zoomControl") {
        if (value) {
            if (!this.zoomControl) {
                this.zoomControl = L.control.zoom($.extend({position:"topleft"},(gokartEnv.zoomControl && gokartEnv.zoomControl.options)?gokartEnv.zoomControl.options:{}))
            }
            if (!this.zoomControl._map) {
                this.zoomControl.addTo(this._map)
            }
        } else {
            if (this.zoomControl && this.zoomControl._map) {
                this.zoomControl.remove()
            }
        }
    } else if(key === "attributionControl") {
        if (value) {
            if (!this.attributionControl) {
                this.attributionControl = L.control.attribution($.extend({position:"bottomright"},(gokartEnv.attributionControl && gokartEnv.attributionControl.options)?gokartEnv.attributionControl.options:{}))
            }
            if (!this.attributionControl._map) {
                this.attributionControl.addTo(this._map)
            }
        } else {
            if (this.attributionControl && this.attributionControl._map) {
                this.attributionControl.remove()
            }
        }
    } else if(key === "scaleControl") {
        if (value) {
            if (!this.scaleControl) {
                this.scaleControl = L.control.scale($.extend({position:"bottomleft"},(gokartEnv.scaleControl && gokartEnv.scaleControl.options)?gokartEnv.scaleControl.options:{}))
            }
            if (!this.scaleControl._map) {
                this.scaleControl.addTo(this._map)
            }
        } else {
            if (this.scaleControl && this.scaleControl._map) {
                this.scaleControl.remove()
            }
        }
    } else if(key === "fullpageControl") {
        if (value) {
            if (!this.fullpageControl) {
                this.fullpageControl = L.control.fullpage()
            }
            if (!this.fullpageControl._map) {
                this.fullpageControl.addTo(this._map)
            }
        } else {
            if (this.fullpageControl && this.fullpageControl._map) {
                this.fullpageControl.remove()
            }
        }
    }
}
//Return the leaflet object
Map.prototype.getLMap = function() {
    return this._map
}
//Return the map element
Map.prototype.getMapElement = function() {
    return this._mapElement
}

//return ture if in max bounds;othewise return false
Map.prototype.inMaxBounds = function(latlng) {
    if (this._options["maxBounds"]) {
        return this._options["maxBounds"].contains(latlng)
    } else {
        return true
    }
}

Map.prototype.setSize = function(width,height) {
    this._map.setSize(width,height)
}

Map.prototype.isAuthenticated = function() {
    return this._user["authenticated"]
}

Map.prototype._create = function() {
    if (this._map) {
        //already created
        return
    }
    //create leaflet map
    this._map = L.map(this._mapid,$.extend({},this._options,{zoomControl:false,attributionControl:false,scaleControl:false,fullpageControl:false}))

    if (this._options["bounds"]) {
        this._map.fitBounds(this._options["bounds"])
    }

    var vm = this
    $.each(["zoomControl","attributionControl","scaleControl","fullpageControl"],function(index,key) {
        vm.setOption(key,vm._options[key] || false,true)
    })

    this.featureInfo = new FeatureInfo(this)
    //load and add layers
    Layer.loadLayers(this)
}


export default Map
