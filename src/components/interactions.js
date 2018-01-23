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

    var vm = this
    $.each(gokartEnv.featureInfoPopup || {},function(key,value) {
        vm["_" + key] = value
    })
    this._options = $.extend({},FeatureInfo.defaultOptions,this._options || {})

    this._layer = null
    this._eventType = eventType || "click"
    this._enabled = false
    this._feats = []
    this._featsSize = 0
    this._featIndex = -1
    this._popup = null
    this._popupHtmlElement = null;

    this._options = $.extend(FeatureInfo.defaultOptions,(gokartEnv.featureInfoPopup && gokartEnv.featureInfoPopup.options)?gokartEnv.featureInfoPopup.options:{})
}
FeatureInfo.defaultOptions = {
    autoPan:true,
    closeButton:true,
}
//enable/disable this interaction
FeatureInfo.prototype.enable = function(enable) {
    var vm = this
    this._showFeatureInfo = this._showFeatureInfo || function(ev) {
        var url = null
        var buffer = 10
        if (!vm._map.inMaxBounds(ev.latlng)) {
            //not in the map bounds
            return
        }
        if (vm._layer._geometryType === "polygon") {
            if (!vm._layer._geometryColumn) {
                buffer = 1
            } else {
               url = gokartEnv.wfsService + "/wfs?service=wfs&version=2.0&request=GetFeature&outputFormat=application%2Fjson&typeNames=" + vm._layer.getId() + "&cql_filter=CONTAINS(" + vm._layer._geometryColumn + ",POINT(" + ev.latlng.lat + " " + ev.latlng.lng + "))"
            }
        }
        if (!url) {
            var topLeft = vm._map.getLMap().layerPointToLatLng([ev.layerPoint.x - 10,ev.layerPoint.y - 10])
            var bottomRight = vm._map.getLMap().layerPointToLatLng([ev.layerPoint.x + 10,ev.layerPoint.y + 10])
            var bbox = "&bbox=" + bottomRight[1] + "," + topLeft[0] + "," + topLeft[1] + "," + bottomRight[0]
            url = gokartEnv.wfsService + "/wfs?service=wfs&version=2.0&request=GetFeature&outputFormat=application%2Fjson&typeNames=" + vm._layer.getId() + bbox
        }

        $.ajax({
            url:url,
            dataType:"json",
            success: function (response, stat, xhr) {
                if (response.totalFeatures < 1) {
                    return
                }
                var feat = response.features[0]
                //populate the feature info
                if (vm._popupHtmlElement === null) {
                    var msg = null;
                    msg = "<div id='feature_info'><table>"
                    msg += "<tbody>"
                    if (vm._layer._featureInfo.properties) {
                        $.each(vm._layer._featureInfo.properties,function(index,k){
                            msg += "<tr><th>" + k.camelize() + "</th><td id=featureinfo_" + k + "></td></tr>"
                        })
                    } else {
                        $.each(feat.properties,function(k,v){
                            if (["ogc_fid","md5_rowhash"].indexOf(k.toLowerCase()) >= 0 ) {
                                return
                            }
                            msg += "<tr><th>" + k.camelize() + "</th><td id=featureinfo_" + k + "></td></tr>"
                        })
                    }
                    msg += "</tbody>"
                    msg += "<tfoot><tr id='featureinfo_feature_navigator'><td colspan='2'>"
                    msg += "<img id='featureinfo_navigator_previous' class='featureinfo_navigator_button' src='" + gokartEnv.gokartService + "/dist/static/images/previous.svg'> <span id='featureinfo_current_index'></span>/<span id='featureinfo_size'></span> <img id='featureinfo_navigator_next' class='featureinfo_navigator_button' src='" + gokartEnv.gokartService + "/dist/static/images/next.svg'>"
                    msg += "</td></tr></tfoot>"
                    msg += "</table></div>"

                    vm._popupHtmlElement = $($.parseHTML(msg))
                    vm._popupHtmlElement.find("#featureinfo_navigator_previous").on("click",function(ev){
                        ev.stopPropagation()
                        if (vm._featIndex <= 0) {
                            vm.selectFeature(vm._featsSize - 1)
                        } else {
                            vm.selectFeature(vm._featIndex - 1)
                        }
                    })
                    vm._popupHtmlElement.find("#featureinfo_navigator_next").on("click",function(ev){
                        ev.stopPropagation()
                        if (vm._featIndex >= vm._featsSize) {
                            vm.selectFeature(0)
                        } else {
                            vm.selectFeature(vm._featIndex + 1)
                        }
                    })
                    vm._popup.setContent(vm._popupHtmlElement.get(0))
                }
                $.each(response.features,function(index,feat) {
                    if (index >= vm._feats.length) {
                        vm._feats.push({"properties":{}})
                    }
                    if (vm._layer._featureInfo.properties) {
                        $.each(vm._layer._featureInfo.properties,function(index2,k){
                            vm._feats[index]["properties"][k] = (feat.properties[k] === null || feat.properties[k] === undefined)?null:feat.properties[k]
                        })
                    } else {
                        $.each(feat.properties,function(k,v){
                            vm._feats[index]["properties"][k] = (v === null || v === undefined)?null:v
                        })
                    }
                    //highlight the feature
                    if (vm._layer._featureInfo.highlight) {
                        if ( ["polygon","multipolygon"].indexOf(feat["geometry"]["type"].toLowerCase()) >= 0) {
                            if (vm._feats[index]["geometry"]) {
                                vm._feats[index]["geometry"].setLatLngs(L.GeoJSON.coordsToLatLngs(feat["geometry"]["coordinates"],2))
                            } else {
                                vm._feats[index]["geometry"] = L.polygon(L.GeoJSON.coordsToLatLngs(feat["geometry"]["coordinates"],2),vm._layer._featureInfo.style || {})
                            }
                        }
                    }
                })
                vm._featsSize = response.features.length
                if (vm._featsSize < 2) {
                    vm._popupHtmlElement.find("#featureinfo_feature_navigator").hide()
                } else {
                    vm._popupHtmlElement.find("#featureinfo_feature_navigator").show()
                }
                vm.selectFeature(0,ev)

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
        this._map.getMapElement().css("cursor","pointer")
        this._map.getLMap().on(this._eventType,this._showFeatureInfo)
        this._enabled = true
    } else if (!enable && this._enabled) {
        this._map.getMapElement().css("cursor","")
        this._map.getLMap().off(this._eventType,this._showFeatureInfo)
        this._enabled = false
    }
}
//set the layer to fetch info
FeatureInfo.prototype.setLayer = function(layer) {
    if (layer) {
        //try to enable this interaction for the  layer
        if (this._layer === layer) {
            //same layer
            this.enable(true)
            return
        }
        //clear featureinfo for the previous layer
        if (this._layer) {
            this.clear()
        }
        this._layer = layer
        if (this._popupHtmlElement) {
            this._popupHtmlElement.find("#featureinfo_navigator_previous").off("click")
            this._popupHtmlElement.find("#featureinfo_navigator_next").off("click")
            this._popupHtmlElement = null;
        }
        var options = $.extend({},this._options)
        var vm = this
        if (this._layer._featureInfo.buttons) {
            options["buttons"] =[]
            if (this._layer._featureInfo.buttons.indexOf("clear") >= 0) {
                options["buttons"].push([gokartEnv.gokartService + "/dist/static/images/clear.svg",function(ev){
                    ev.stopPropagation()
                    vm.clear()
                }])
            }
        }
        this._popup = L.popup(options)
        this.enable(true)
    } else {
        // disable this interaction, but keep the last layer.
        this.enable(false)
    }
}
//clear the feature info,retrieved from the backend.
FeatureInfo.prototype.clear = function() {
    //clear the feature info,retrieved from the backend.
    if (this._layer._featureInfo.highlight) {
        if (this._featIndex >= 0) {
            this._feats[this._featIndex]["geometry"].closePopup()
            this._feats[this._featIndex]["geometry"].unbindPopup()
            this._feats[this._featIndex]["geometry"].remove()
        }
    } else {
        if (this._popup.isOpen()) {
            this._popup.remove()
        }
    }
    this._featIndex = -1
    this._featsSize = 0
}
//select the feature for popup dialog
FeatureInfo.prototype.selectFeature = function(index,ev) {
    if (index < 0 || index >= this._featsSize) {
        index = 0
    }
    if (!this._popupHtmlElement) return

    var vm = this
    //replace the content
    $.each(this._feats[index]["properties"],function(k,v){
        vm._popupHtmlElement.find("#featureinfo_" + k).text((v===null)?"&nbsp;":v)
    })
    if (this._featsSize > 1) {
        vm._popupHtmlElement.find("#featureinfo_size").text(this._featsSize)
        vm._popupHtmlElement.find("#featureinfo_current_index").text(index + 1)
    }
    if (index === this._featIndex) {
        //choose the same feature
        if (this._layer._featureInfo.highlight) {
            this._feats[index]["geometry"].openPopup((ev)?ev.latlng:undefined)
        } else {
            if (ev) {
                this._popup.setLatLng(ev.latlng)
            }
            if (!this._popup.isOpen()) {
                this._popup.openOn(this._map.getLMap())
            }
        }
    } else {
        if (this._layer._featureInfo.highlight) {
            if (this._featIndex >= 0) {
                this._feats[this._featIndex]["geometry"].unbindPopup()
                this._feats[this._featIndex]["geometry"].remove()
            }
            this._feats[index]["geometry"].bindPopup(this._popup)
            this._feats[index]["geometry"].addTo(this._map.getLMap())
            this._feats[index]["geometry"].openPopup(ev?ev.latlng:this._popup.getLatLng())
        } else {
            if (ev) {
                this._popup.setLatLng(ev.latlng)
            }
            if (!this._popup.isOpen()) {
                this._popup.openOn(this._map.getLMap())
            }
        }
        this._featIndex = index
    }
}


export {FeatureInfo}
