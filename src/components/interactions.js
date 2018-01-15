import {
  $,
  L
} from 'src/vendor.js'

import {Layer} from './layer.js'

//the feature info interaction
var FeatureInfo = function(map,eventType) {
    if (!map) {
        throw "map is null"
    }
    this._map = map
    this._layer = null
    this._eventType = eventType || "click"
    this._enabled = false
    this._options = $.extend(FeatureInfo.defaultOptions,(env.featureInfoPopup && env.featureInfoPopup.options)?env.featureInfoPopup.options:{})
}
FeatureInfo.defaultOptions = {
    autoPan:false,
    closeButton:true,
}
//enable/disable this interaction
FeatureInfo.prototype.enable = function(enable) {
    var vm = this
    this._showFeatureInfo = this._showFeatureInfo || function(ev) {
        var url = null
        var buffer = 10
        if (vm._layer._geometryType === "polygon") {
            if (!vm._layer._geometryColumn) {
                buffer = 1
            } else {
               url = env.wfsService + "/wfs?service=wfs&version=2.0&request=GetFeature&count=1&outputFormat=application%2Fjson&typeNames=" + vm._layer.getId() + "&cql_filter=CONTAINS(" + vm._layer._geometryColumn + ",POINT(" + ev.latlng.lat + " " + ev.latlng.lng + "))"
            }
        }
        if (!url) {
            var topLeft = vm._map.getLMap().layerPointToLatLng([ev.layerPoint.x - 10,ev.layerPoint.y - 10])
            var bottomRight = vm._map.getLMap().layerPointToLatLng([ev.layerPoint.x + 10,ev.layerPoint.y + 10])
            var bbox = "&bbox=" + bottomRight[1] + "," + topLeft[0] + "," + topLeft[1] + "," + bottomRight[0]
            url = env.wfsService + "/wfs?service=wfs&version=2.0&request=GetFeature&count=1&outputFormat=application%2Fjson&typeNames=" + vm._layer.getId() + bbox
        }

        $.ajax({
            url:url,
            dataType:"json",
            success: function (response, stat, xhr) {
                if (response.totalFeatures < 1) {
                    return
                }
                var msg = "<table id='feature-info'>"
                var feat = response.features[0]
                if (vm._layer.featureInfoProperties) {
                    $.each(vm._layer.featureInfoProperties,function(index,k){
                        msg += "<tr><th>" + k + "</th><td>" + (feat.properties[k] === null)?"":feat.properties[k] + "</td></tr>"
                    })
                } else {
                    $.each(feat.properties,function(k,v){
                        if (["ogc_fid","md5_rowhash"].indexOf(k.toLowerCase()) >= 0 ) {
                            return
                        }
                        msg += "<tr><th>" + k + "</th><td>" + ((v === null)?"":v + "</td></tr>")
                    })
                }
                msg += "</table>"
                var popup = L.popup(this._options).setLatLng(ev.latlng).setContent(msg)
                vm._map.getLMap().openPopup(popup)
            },
            error: function (xhr,status,message) {
                vm.warning = true
                alert(xhr.status + " : " + (xhr.responseText || message))
            },
            xhrFields: {
                withCredentials: true
            }
        })

    }
    if (enable && !this._enabled ) {
        //try to enable it
        if (!this._layer) {
            throw "Layer is null"
        }
        console.log("Enable feature info interaction")
        this._map.getLMap().on(this._eventType,this._showFeatureInfo)
    } else if (!enable && this._enabled) {
        console.log("Disable feature info interaction")
        this._map.getLMap().off(this._eventType,this._showFeatureInfo)
    }
}
//set the layer to fetch info
FeatureInfo.prototype.setLayer = function(layer) {
    if (layer) {
        //try to enable this interaction for the  layer
        this._layer = layer
        this.enable(true)
    } else {
        //set the layer to null, and disable this interaction
        this._layer = null
        this.enable(false)
    }
}



export {FeatureInfo}
