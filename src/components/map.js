import {
  $,
  L
} from 'src/vendor.js'

import {Layer} from './layer.js'
import {getCRS} from './crs.js'
import {FeatureInfo} from './featureinfo.js'

var Map = function (gokart) {
    this.gokart = gokart
    this._mapid = gokart.env["mapid"]
    this._mapElement = $("#" + this._mapid)
    this._options = this.gokart.env["map"] || {}
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
    this.layers = {}
    //current base layer shown on map
    this.baselayer = null
    //current top layer shown on map
    this.toplayer = null
    //list of top layer
    this.toplayers = []

    this._setToplayerTaskRunTime = null
    this._setToplayerTask = null
    
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
        if (!this.gokart.embeded) {
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
                this.zoomControl = L.control.zoom($.extend({position:"topleft"},(this.gokart.env["zoomControl"] && this.gokart.env["zoomControl"]["options"])?this.gokart.env["zoomControl"]["options"]:{}))
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
                this.attributionControl = L.control.attribution($.extend({position:"bottomright"},(this.gokart.env["attributionControl"] && this.gokart.env["attributionControl"]["options"])?this.gokart.env["attributionControl"]["options"]:{}))
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
                this.scaleControl = L.control.scale($.extend({position:"bottomleft"},(this.gokart.env["scaleControl"] && this.gokart.env["scaleControl"]["options"])?this.gokart.env["scaleControl"]["options"]:{}))
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
                this.fullpageControl = L.control.fullpage(this)
            }
            if (!this.fullpageControl._map) {
                this.fullpageControl.addTo(this._map)
            }
        } else {
            if (this.fullpageControl && this.fullpageControl._map) {
                this.fullpageControl.remove()
            }
        }
    } else if(key === "featureCountControl") {
        if (value) {
            if (!this.featureCountControl) {
                this.featureCountControl = L.control.featureCount(this)
            }
            if (!this.featureCountControl._map) {
                this.featureCountControl.addTo(this._map)
            }
        } else {
            if (this.featureCountControl && this.featureCountControl._map) {
                this.featureCountControl.remove()
            }
        }
    } else if(key === "layerMetadataControl") {
        if (value) {
            if (!this.layerMetadataControl) {
                this.layerMetadataControl = L.control.layerMetadata(this)
            }
            if (!this.layerMetadataControl._map) {
                this.layerMetadataControl.addTo(this._map)
            }
        } else {
            if (this.layerMetadataControl && this.layerMetadataControl._map) {
                this.layerMetadataControl.remove()
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
//set top layer
//layerid: the layer you want to set as top layer, can be a index of toplayers; Layer instance, or Layer id
//action: can be "add" ,"refresh"; if layerid is specified, default action is "add"; if layerid is not specified,action is "auto"
Map.prototype.setToplayer = function(layerid,action) {
    //console.log("setToplayer:layer = " + layerid + ", action = " + action )
    if (this.toplayers.length === 0) {
        //no toplayers
        return
    }

    var layer = null
    //get the layer you want to set if specified; if not found, then will use the first top layer
    if (layerid === null || layerid === undefined) {
        layer = null
    } else if (layerid instanceof Layer) {
        layer = this.getLayer(layerid)
        if (!layer.isToplayer()) {
            throw "Layer '" + layer["_id"] + "' is not a top layer."
        }
    } else if (typeof layerid === "number") {
        try {
            layer = this.toplayers[layerid]
            if (!layer) {
                throw layerid + " is out of index"
            }
        } catch (ex) {
            layer = null
        }
    } else {
        $.each(this.toplayers,function(index,l){
            if (l._id === layerid) {
                layer = l
                return false
            }
        })
        if (layer === null) {
            throw "Layer '" + layerid + "' is not a top layer."
        }
    }

    if (layer === null) {
        //set top layer automatically
        layerid = 0
        layer = this.toplayers[layerid]
        action = "auto"
    } else if (action === null || action === undefined) {
        action = "add"
    }

    if (this._setToplayerTask !== null && this._setToplayerTask !== undefined) {
        //still have setToplayerTask, clean it
        try {
            //console.log("clean setToplayer task" )
            clearTimeout(this._setToplayerTask)
        } catch(ex) {
            //ignore 
        }
        this._setToplayerTask = null
        this._setToplayerTaskRunTime = null
    }

    var vm = this
    if (action === "add") {
        layer.addToMap()    
    } else if (action === "refresh") {
        if (layer.isAdded()) {
            layer.refresh()
        } else {
            layer.addToMap()
        }
    } else if (action === "auto") {
        if (layer._show) {
            layer._show.call(layer,function(action,nextRunDatetime){
                //console.log("Call show of the layer '" +  layer ._id + "' to check whether to show the layer or not. action = " + action + ", wait " + nextRunDatetime + " milleseconds for next check")
                if (action === "add") {
                    layer.addToMap()
                } else if (action === "refresh") {
                    if (layer.isAdded()) {
                        layer.refresh()
                    } else {
                        layer.addToMap()
                    }
                } else if (action === "update") {
                    //the only difference between update and refresh is feature info popup window should be closed for update, but not for refresh,
                    if (layer.isAdded()) {
                        layer.map.featureInfo.clear()
                        layer.refresh()
                    } else {
                        layer.addToMap()
                    }
                } else if (layerid === vm.toplayers.length - 1 && vm.toplayer === null) {
                    layer.addToMap()
                } else if (action === "wait") {
                    //do nothing
                } else if (action === null) {
                    vm.setToplayer(layerid + 1,"auto")
                    return
                } else {
                    alert("The show action '" + action + "' Not Support")
                    return 
                }
                if (nextRunDatetime) {
                    vm._setToplayerTaskRunTime = nextRunDatetime
                    vm._setToplayerTask = setTimeout(function() {
                        vm._setToplayerTask = null
                        vm._setToplayerTaskRunTime = null
                        vm.setToplayer()
                    },nextRunDatetime - new Date())
                    //console.log("start setToplayer task" )
                }
                
            })
        } else if (vm.toplayer === null) {
            //currently, no toplayer , and this layer has no addToMap function, add it to map by default
            layer.addToMap()
        }
    }
}

Map.prototype.getLayer = function(layer) {
    if (typeof(layer) === "string") {
        if (layer in this.layers) {
            return this.layers[layer]
        } else {
            throw "The layer '" + layer + "' is not found"
        }
    } else if (layer instanceof Layer) {
        //a Layer instance,should be in layers
        if (layer["_id"] in this.layers) {
            return this.layers[layer["_id"]]
        } else {
            throw "The layer '" + layer._id + "' is not registered"
        }
    } else if (layer["id"]) {
        //a layer configuration object
        if (layer["id"] in this.layers) {
            return this.layers[layer["id"]]
        } else {
            throw "The layer '" + layer._id + "' is created"
        }
    }
}

Map.prototype.registerLayer = function(layer) {
    if (layer instanceof Layer) {
        if (this.layers[layer["_id"]]) {
            throw "The layer '" + layer["_id"] + "' already exist."
        } else {
            this.layers[layer["_id"]] = layer
            //add to toplayers if it is a top layer
            if (layer.isToplayer()) {
                this.toplayers.push(layer)
            }
        }
    } else {
        throw "The parameter 'layer' should be a Layer instance."
    }
}
Map.prototype.isAuthenticated = function() {
    return this.gokart.isAuthenticated()
}

Map.prototype.getOption = function(name) {
    return this._options[name]
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
    $.each(["zoomControl","attributionControl","scaleControl","fullpageControl","featureCountControl","layerMetadataControl"],function(index,key) {
        vm.setOption(key,vm._options[key] || false,true)
    })

    this.featureInfo = new FeatureInfo(this)

    //load and add layers
    Layer.loadLayers(this)
}


export default Map
