import {
  $,
  L
} from 'src/vendor.js'

import Layer from './layer.js'
import {getCRS} from './crs.js'

var Map = function (mapid) {
    this._mapid = mapid
    this._options = env["map"] || {}
    if ("crs" in this._options && typeof(this._options["crs"]) === "string") {
        this._options["crs"] = getCRS(this._options["crs"])
    }
    if ("maxBounds" in this._options && Array.isArray(this._options["maxBounds"])) {
        this._options["maxBounds"] = L.latLngBounds(L.latLng(this._options["maxBounds"][0],L.latLng(this._options["maxBounds"][1])))
    }
    this._map = null
    this.create()
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

Map.prototype.create = function() {
    if (this._map) {
        //already created
        return
    }
    //create leaflet map
    console.log(this._options)
    this._map = L.map(this._mapid,this._options)
    var vm = this
    //add default layers
    $.each(env["layers"] || [],function(index,layer){
        Layer.getLayer(layer).setMap(vm._map)
    })
}


export default Map
