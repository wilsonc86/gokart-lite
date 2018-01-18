import {
  $,
  L
} from 'src/vendor.js'

import {Layer} from './layer.js'
import {getCRS} from './crs.js'
import {FeatureInfo} from './interactions.js'

var Map = function (mapid) {
    this._mapid = mapid
    this._mapElement = $("#" + mapid)
    this._options = gokartEnv["map"] || {}
    if ("crs" in this._options && typeof(this._options["crs"]) === "string") {
        this._options["crs"] = getCRS(this._options["crs"])
    }

    if ("maxBounds" in this._options && Array.isArray(this._options["maxBounds"])) {
        this._options["maxBounds"] = L.latLngBounds(L.latLng(this._options["maxBounds"][0],L.latLng(this._options["maxBounds"][1])))
    }
    this._map = null
    this._create()
}
//set map option
//parameters:key,value
Map.prototype.setOption = function(key,value) {
    if (key === "crs" && typeof(value) === "string") {
        value = getCRS(value)
    } else if (key === "maxBounds" && Array.isArray(value)) {
        value = L.latLngBounds(L.latLng(value[0],L.latLng(value[1])))
    } else if (self._options[key] === value) {
        return
    }

    self._options[key] = value
    if (!this._map) return

    if (key === "center") {
        this._map.setView(value)
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

//Return the map element
Map.prototype.setSize = function(width,height) {
    width = width || this._mapElement.width()
    height = height || this._mapElement.height()
    if (width === this._mapElement.width() && height === this._mapElement.height()) {
        return
    }
    var center = this._map.getCenter()
    var zoom = this._map.getZoom()
    this._mapElement.width(width)
    this._mapElement.height(height)
    this._map.invalidateSize(); 
    this._map.setView(center,zoom)
    
}

Map.prototype._create = function() {
    if (this._map) {
        //already created
        return
    }
    //create leaflet map
    this._map = L.map(this._mapid,this._options)

    this.featureInfo = new FeatureInfo(this)
    //load and add layers
    Layer.loadLayers(this)
}


export default Map
