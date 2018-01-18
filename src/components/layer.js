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
    $.each(layer,function(key,value) {
        vm["_" + key] = value
    })

    this._options = this._options || {}
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
//current base layer shown on map
Layer.baselayer = null
//current top layer shown on map
Layer.toplayer = null
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
        layer.serviceType = layer.serviceType || "WMTS"
        if (layer.serviceType === "WMS") {
            layer = new WMSTileLayer(layer)
        } else if (layer.serviceType === "WMTS") {
            layer = new TileLayer(layer)
        } else {
            throw layer.serviceType + " not supported."
            layer = null
        }
    }
    return layer
}
//load layers from csw and merge with layers configured in environment file; and then add them to map
Layer.loadLayers = function(map) {
    gokartEnv.cswApp = (gokartEnv.cswApp || gokartEnv.app).toLowerCase()
    var vm = this
    var req = new window.XMLHttpRequest()
    req.withCredentials = true
    req.onload = function () {
        var layers = []
        JSON.parse(this.responseText).forEach(function (l) {
          // add the base flag for layers tagged 'basemap'
          if (l.tags.some(function (t) {return t.name === 'basemap'})) {
              l.layerType = "baselayer"
          } else {
              l.layerType = "overlayer"
          }
          l.serviceType = "WMTS"
  
          layers.push(l)
        })
        //merge the layers loaded from csw with layer cofigured in environment files and set the zIndex configured in environment file
        var zindex = 3
        $.each(gokartEnv.layers || [],function(index,l) {
            var layer = layers.find(function(o) {return o.id === l.id})
            if (layer) {
                $.extend(layer,l)
            } else {
                layers.push(l)
                layer = l
            }
            layer.options = layer.options || {}
            if (layer.layerType === "baselayer") {
                layer.options["zIndex"] = 1
            } else if (layer.layerType === "toplayer") {
                layer.options["zIndex"] = 1000
            } else if (layer.options["zIndex"] && layer.options["zIndex"] >= 100 && layer.options["zIndex"] < 1000) {
                //do nothine
            } else {
                layer.options["zIndex"] = zIndex
                zIndex += 1
            }
        })

        //set other options
        $.each(layers,function(index,l) {
            if (l.layerType === "baselayer") {
                l.options["opacity"] = 1
                l.options["zIndex"] = 1
                if (l.options["zIndex"] === null || l.options["zIndex"] === undefined) {
                }
            } else if (l.layerType === "overlayer") {
                if (l.options["zIndex"] === null || l.options["zIndex"] === undefined) {
                    l.options["zIndex"] = 2
                }
                if (l.options["opacity"] === null || l.options["opacity"] === undefined) {
                    l.options["opacity"] = 0.5
                }
            }  else {
                l.options["zIndex"] = 1000
                if (l.options["opacity"] === null || l.options["opacity"] === undefined) {
                    l.options["opacity"] = 0.8
                }
            }
        })

        //add layers
        $.each(layers,function(index,l){
            try {
                l = Layer.getLayer(l)
            } catch(ex) {
                alert(ex)
                return
            }
            if (l.isBaselayer() && Layer.baselayer === null) {
                l.setMap(map)
            } else if (l.isToplayer() && Layer.toplayer === null) {
                l.setMap(map)
            } else if (l.isOverlayer()) {
                l.setMap(map)
            }

        })
    }
    req.onerror = function (ev) {
      var msg ='Couldn\'t load layer catalogue!' +  (req.statusText? (" (" + req.statusText + ")") : '')
      console.error(msg)
      alert(msg)
    }
    req.open('GET', gokartEnv.cswService + "?format=json&application__name=" + gokartEnv.cswApp)
    req.send()


}


//Create a leaflet layer
Layer.prototype._create = function() {
    throw "Not implemented"
}
//return layer id
Layer.prototype.getId = function() {
    return this._id
}
//return true if it is a base layer
Layer.prototype.isBaselayer = function() {
    return this._layerType === "baselayer"
}
//return true if it is a overview layer
Layer.prototype.isOverlayer = function() {
    return this._layerType === "overlayer"
}
//return true if it is a top layer
Layer.prototype.isToplayer = function() {
    return this._layerType === "toplayer"
}

//add to map if map is not null; remove from map if map is null
Layer.prototype.setMap = function(map) {
    if (map) {
        //add to map
        if (this._map && this._map) {
            //already added to the map
            return
        } else if (!this._mapLayer) {
            //mapLayer is not created
            this._create()
        }
        if (this.isBaselayer() && Layer.baselayer) {
            //remove the current base layer from map
            layer.baselayer.setMap(null)
        } else if (this.isToplayer() && Layer.toplayer) {
            //remove the current top layer from map
            layer.toplayer.setMap(null)
        }
        this._mapLayer.addTo(map.getLMap())

        this._map = map
        if (this.isBaselayer()) {
            Layer.baselayer = this
        } else if (this.isToplayer()) {
            Layer.toplayer = this
            this._map.featureInfo.setLayer(this)
        }

    } else if(this._map) {
        //remove from map
        this._mapLayer.remove()
        if (Layer.baselayer === this) {
            //it is a current base layer
            Layer.baselayer = null
        } else if (Layer.toplayer === this) {
            //it is a current top layer
            Layer.toplayer = null
            this._map.featureInfo.setLayer(null)
        }
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
    this._mapLayer = L.tileLayer.wms(gokartEnv.wmsService,this._options)
}


//Tile layer
var TileLayer = function(layer) {
    Layer.call(this,layer)
    this._tileUrl = gokartEnv.wmtsService + "?layer=" + this._id + "&style=" + this._options["style"] + "&tilematrixset=" + this._options["tilematrixset"] + "&Service=WMTS&Request=GetTile&Version=1.0.0&Format=" + this._options["format"] + "&TileMatrix=" + this._options["tilematrixset"] + ":{z}&TileCol={x}&TileRow={y}"
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
    tileSize:1024
}

TileLayer.prototype._create = function() {
    if (this._mapLayer) return
    this._mapLayer = L.tileLayer(this._tileUrl,this._options)
}

export {Layer}
