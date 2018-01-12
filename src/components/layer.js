import {
  $,
  L
} from 'src/vendor.js'

import {getCRS} from './crs.js'

var _Layers = {
}

var Layer = function(layer) {
    if (layer["id"] in _Layers) {
        //layer id is already existed.
        throw "The layer '" + layer["id"] + "' already exist."
    }
    if (this.constructor === Layer) {
        throw "Can't create a instance of a abstract class"
    }
    var vm = this
    this._id = layer["id"]
    this._base = layer["base"]?true:false
    this._options = layer.options || {}
    $.each(this.defaultOptions,function(key,value){
        if (!(key in vm._options)) {
            vm._options[key] = value
        }
    })
 
    if (this._base) {
        this._options["zIndex"] = 1
    } else if(this._options["zIndex"] === null || this._options["zIndex"] === undefined) {
        this._options["zIndex"] = 10
    }
    this._mapLayer = null
    this._map = null

    //register this layer
    _Layers[this._id] = this
}
//return a layer object
//same layer id will return the same layer object
Layer.getLayer = function(layer) {
    var  layerid = null
    if (typeof(layer) === "string") {
        layerid = layer
        if (layer in _Layers) {
            layer = _Layers[layer]
        } else {
            throw "The layer '" + layer + "' is not found"
        }
    } else if (layer instanceof Layer){
        layer = layer
    } else {
        layerid = layer.id
        if (layer.type === "wmsTileLayer") {
            layer = new WMSTileLayer(layer)
        } else if (layer.type === "tileLayer") {
            layer = new TileLayer(layer)
        } else {
            layer = null
            throw layer.type + " not supported."
        }
    }
    return layer
}

//Create a leaflet layer
Layer.prototype._create = function() {
    throw "Not implemented"
}
//return layer id
Layer.prototype.getId = function() {
    return this._id
}
//return layer id
Layer.prototype.isBaseLayer = function() {
    return this._base
}

//add to map if map is not null; remove from map if map is null
Layer.prototype.setMap = function(map) {
    if (map) {
        //add to map
        if (this._map && this._map === map) {
            //already add to the map
            return
        } else if (this._map) {
            //alread add to a different map
            this._mapLayer.remove()
            this._map = null
        } else if (!this._mapLayer) {
            //mapLayer is not created
            this._create()
        }
        this._mapLayer.addTo(map)
        this._map = map

    } else if(this._map) {
        //remove from map
        this._mapLayer.remove()
        this._map = null
    }
}
//WMS tile layer
var WMSTileLayer = function(layer) {
    Layer.call(this,layer)
    if ("crs" in this._options && typeof(this._options["crs"]) === "string") {
        this._options["crs"] = getCRS(this._options["crs"])
    }
    this._options["layers"] = this._id
}

WMSTileLayer.prototype = Object.create(Layer.prototype)
WMSTileLayer.prototype.constructor = WMSTileLayer

WMSTileLayer.prototype.defaultOptions = {
    crossOrigin:true,
    styles:'',
    format:'image/png',
    transparent:true,
    version:"1.1.1",
    crs:L.CRS.EPSG4326,
    tileSize:256,
    opacity:1,
    updateWhenIdle:true,
    updateWhenZooming:true,
    updateInterval:200,
    keepBuffer:4
}

WMSTileLayer.prototype._create = function() {
    if (this._mapLayer) return
    this._mapLayer = L.tileLayer.wms(env.wmsService,this._options)
}

//Tile layer
var TileLayer = function(layer) {
    Layer.call(this,layer)
    this._tileUrl = env.wmtsService + "?layer=" + this._id + "&style=" + this._options["style"] + "&tilematrixset=" + this._options["tilematrixset"] + "&Service=WMTS&Request=GetTile&Version=1.0.0&Format=" + this._options["format"] + "&TileMatrix=" + this._options["tilematrixset"] + ":{z}&TileCol={x}&TileRow={y}"
}

TileLayer.prototype = Object.create(Layer.prototype)
TileLayer.prototype.constructor = TileLayer

TileLayer.prototype.defaultOptions = {
    crossOrigin:true,
    style:'',
    tilematrixset:"gda94",
    format:'image/png',
    Version:"1.0.0",
    transparent:true,
    version:"1.1.1",
    opacity:1,
}

TileLayer.prototype._create = function() {
    if (this._mapLayer) return
    this._mapLayer = L.tileLayer(this._tileUrl,this._options)
}

export default Layer
