import {
  $,
  L
} from 'src/vendor.js'

import {getCRS} from './crs.js'

var Layer = function(map,layer) {
    if (this.constructor === Layer) {
        throw "Can't create a instance of a abstract class"
    }
    var vm = this
    //get the options from env file,and append "_" to all option name
    $.each(layer,function(key,value) {
        vm["_" + key] = value
    })

    //use the default options if not configured
    this._options = this._options || {}
    $.each(this.defaultOptions,function(key,value){
        if (!(key in vm._options)) {
            vm._options[key] = value
        }
    })
 
    this._mapLayer = null
    this.map = map
    this._featureCount = null
    this.addTime = null
    this.refreshTime = null
    this._baseurl = null
}
//return a layer object
//same layer id will return the same layer object
Layer.getLayer = function(map,layer) {
    try {
         return map.getLayer(layer)
    }catch (ex) {
        if (layer instanceof Layer) {
            //already a Layer instance, register it
            map.regiterLayer(layer)
        } else if (layer["id"]){
            //a layer configuration json object, create a Layer instance and register it
            var layerid = layer.id
            layer.serviceType = layer.serviceType || "WMTS"
            if (layer.serviceType === "WMS") {
                layer = new WMSTileLayer(map,layer)
            } else if (layer.serviceType === "WMTS") {
                layer = new TileLayer(map,layer)
            } else if (!layer.serviceType){
                throw "serviceType is not configured for layer '" + layerid + "'."
            } else {
                throw layer.serviceType + " not supported."
            }
            map.registerLayer(layer)
        }
        return layer
    }
}

//load layers from csw and merge with layers configured in environment file; and then add them to map
Layer.loadLayers = function(map) {
    map.gokart.env["cswApp"] = (map.gokart.env["cswApp"] || map.gokart.env["app"]).toLowerCase()
    var vm = this
    var processLayers = function(layers) {
        //merge the layers loaded from csw with layer cofigured in environment files and set the zIndex if it is not configured in environment file
        //zindex: 
        //  1: base layer
        //  1000+: top layer
        //  2 - 999: over layer
        //      2 - 299: system automatic allocated zindex for layers which zindex is not configured in environment file
        //      300 - 999: user configured zindex
        var zIndex = 2
        var toplayer_zIndex = 1000
        $.each(map.gokart.env["layers"] || [],function(index,l) {
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
                layer.options["zIndex"] = toplayer_zIndex
                toplayer_zIndex += 1
            } else if (layer.options["zIndex"] && layer.options["zIndex"] >= 300 && layer.options["zIndex"] < 1000) {
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
            } else if (l.layerType === "overlayer") {
                if (l.options["opacity"] === null || l.options["opacity"] === undefined) {
                    l.options["opacity"] = 0.5
                }
            }  else {
                if (l.options["opacity"] === null || l.options["opacity"] === undefined) {
                    l.options["opacity"] = 0.8
                }
            }
            l.requireAuth = !(l.id.startsWith('public:'))
        })
        
        //add layers
        var baselayers = {}
        var overlayers = {}
        var baselayerCount = 0
        var overlayerCount = 0
        $.each(layers,function(index,l){
            if (!l.requireAuth) {
                //public layer
                if (map.isAuthenticated() && l.disable4AuthedUser) {
                    //disabled for auth user
                    return
                }
            } else if(!map.isAuthenticated()) {
                //non public layer is disabled for guest
                return
            }
            try {
                l = Layer.getLayer(map,l)
            } catch(ex) {
                console.error(ex)
                alert(ex)
                return
            }

            if (l.isBaselayer()) {
                baselayers[l._title || l._id] = l.getMapLayer()
                baselayerCount += 1
                if (baselayerCount === 1) {
                    l.addToMap()
                }
            } else if (l.isOverlayer()) {
                l.addToMap()
                overlayers[l._title || l._id] = l.getMapLayer()
                overlayerCount += 1
            }
        })

        map.setToplayer()

        //add layer controls if required
        if (baselayerCount > 1 || overlayerCount > 0) {
            //has at least two base layers or one over layers, add the layer control
            L.control.layers((baselayerCount > 1)?baselayers:null,(overlayerCount > 0)?overlayers:null).addTo(map.getLMap())
        }
    }

    if (map.isAuthenticated()) {
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
            processLayers(layers)
        }
        req.onerror = function (ev) {
            var msg ='Couldn\'t load layer catalogue!' +  (req.statusText? (" (" + req.statusText + ")") : '')
            console.error(msg)
            alert(msg)
        }
        req.open('GET', map.gokart.env["cswService"] + "?format=json&application__name=" + map.gokart.env["cswApp"])
        req.send()
    } else {
        processLayers([])
    }
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
Layer.prototype.getMapLayer = function() {
    if (!this._mapLayer) {
        this._create()
        this._baseurl = this._mapLayer._url
        this._mapLayer.layer = this
        this._mapLayer.on("add",function(ev){
            var layer = this.layer
            layer.addTime = new Date()
            layer.refreshTime = layer.addTime
            if (layer.isBaselayer()) {
                layer.map.baselayer = layer
            } else if (layer.isToplayer()) {
                layer.map.toplayer = layer
                layer.map.featureInfo.setLayer(layer)
                if (layer.map.featureCountControl) layer.map.featureCountControl.setLayer(layer)
                if (layer.map.layerMetadataControl) layer.map.layerMetadataControl.setLayer(layer)
            }
        })
        this._mapLayer.on("remove",function(ev){
            var layer = this.layer
            layer.addTime = null
            layer.refreshTime = null
            if (layer.isBaselayer() && layer.map.baselayer === this.layer) {
                layer.map.baselayer = null
            } else if (layer.isToplayer() && layer.map.toplayer === this.layer) {
                layer.map.featureInfo.setLayer(null)
                if (layer.map.featureCountControl) layer.map.featureCountControl.setLayer(null)
                if (layer.map.layerMetadataControl) layer.map.layerMetadataControl.setLayer(null)
                layer.map.toplayer = null
            }
        })
    //load and add layers
    }
    return this._mapLayer
}

Layer.prototype.refresh = function() {
    if (!this.isAdded()) {
        //not shown on map. return directly
        return
    }
    this.refreshTime = new Date()
    this._options["revision"] = (this._options["revision"] || 0) + 1
    this._mapLayer._url = this._baseurl + "&revision=" + this._options["revision"]
    this._mapLayer.redraw()
    if (this.isToplayer()) {
        if (this.map.featureCountControl) {
            this.map.featureCountControl.showFeatureCount(true)
        }
        if (this.layerMetadataControl) {
            this.map.layerMetadataControl.setLayer(this,true)
        }

    }
    
}
//return true if it is  public layer;otherwise return false
Layer.prototype.requireAuth = function() {
    return this._requireAuth
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

Layer.prototype.isAdded = function() {
    return (this._mapLayer && this._mapLayer._map)?true:false
}

Layer.prototype.getFeatureCount = function(refresh,successCallback,failedCallback) {
    if (!successCallback) {
        successCallback = function(featurecount) {
            alert(featurecount)
        }
    }
    if (!failedCallback) {
        failedCallback = function(msg) {
            alert(msg)
        }
    }
    if (refresh || this._featureCount === null) {
        var vm = this
        var url = (this.requireAuth()?this.map.gokart.env["wfsService"]:this.map.gokart.env["publicWfsService"]) + "/wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=" + this.getId() + "&resultType=hits"
        $.ajax({
            url:url,
            dataType:"xml",
            success: function (response, stat, xhr) {
                try {
                    var previousFeaturecount = (vm._featureCount === undefined)?null:vm._featureCount
                    vm._featureCount = parseInt(response.firstChild.getAttribute("numberOfFeatures"))
                    successCallback(vm._featureCount,previousFeaturecount)
                } catch(msg) {
                    failedCallback(msg)
                }
            },
            error: function (xhr,status,message) {
                failedCallback(xhr.status + " : " + (xhr.responseText || message))
            },
            xhrFields: {
                withCredentials: true
            }
        })
    } else {
        successCallback(this._featureCount)
    }
}

//add to map if map is not null; remove from map if map is null
Layer.prototype.addToMap = function(add) {
    if (add === undefined) {
        add = true
    }
    if (add) {
        //add to map
        if (this.isAdded()) {
            //already added to the map
            return
        } else if (!this._mapLayer) {
            //mapLayer is not created
            this.getMapLayer()
        }
        if (this.isBaselayer() && this.map.baselayer) {
            //remove the current base layer from map
            this.map.baselayer.addToMap(false)
        } else if (this.isToplayer() && this.map.toplayer) {
            //remove the current top layer from map
            this.map.toplayer.addToMap(false)
        }
        this._mapLayer.addTo(this.map.getLMap())
    } else if(this.isAdded()) {
        //remove from map
        this._mapLayer.remove()
    }
}


//WMS tile layer
var WMSTileLayer = function(map,layer) {
    Layer.call(this,map,layer)
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
    this._mapLayer = L.tileLayer.wms((this.requireAuth()?this.map.gokart.env["wmsService"]:this.map.gokart.env["publicWmsService"]),this._options)
}


//Tile layer
var TileLayer = function(map,layer) {
    Layer.call(this,map,layer)
    this._tileUrl = (this.requireAuth()?this.map.gokart.env["wmtsService"]:this.map.gokart.env["publicWmtsService"]) + "?layer=" + this._id + "&style=" + this._options["style"] + "&tilematrixset=" + this._options["tilematrixset"] + "&Service=WMTS&Request=GetTile&Version=1.0.0&Format=" + this._options["format"] + "&TileMatrix=" + this._options["tilematrixset"] + ":{z}&TileCol={x}&TileRow={y}"
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
