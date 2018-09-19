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
    this.map = map

    var vm = this

    this._layer = null
    this._eventType = eventType || "click"
    this._enabled = false
    //_feats array is reused,
    this._feats = []
    //indicate validate features in _feats array
    this._featsSize = 0
    //the index of the feature shown in popup window
    this._featIndex = -1
    this._popup = null
    this._setPopupContent = true

    this._popupOptions = $.extend(FeatureInfo.defaultOptions,(this.map.gokart.env["featureInfoPopup"] && this.map.gokart.env["featureInfoPopup"]["options"])?this.map.gokart.env["featureInfoPopup"]["options"]:{})
}
FeatureInfo.defaultOptions = {
    autoPan:true,
    closeButton:true,
}
//enable/disable this interaction
FeatureInfo.prototype.enable = function(enable) {
    var vm = this
    this._showFeatureInfo = this._showFeatureInfo || function(ev,tryTimes) {
        var url = null
        tryTimes = tryTimes || 0
        if (!vm.map.inMaxBounds(ev.latlng)) {
            //not in the map bounds
            return
        }
        var buffer = null
        var params = null
        if (tryTimes === 0) {
            if (vm._layer._geometryType === "polygon") {
                if (!vm._layer._geometryColumn) {
                    buffer = vm._layer._featureInfo.buffer || 1
                } else {
                    params = "cql_filter=CONTAINS(" + vm._layer._geometryColumn + ",POINT(" + ev.latlng.lat + " " + ev.latlng.lng + "))"
                }
            } else {
                buffer = vm._layer._featureInfo.buffer || 10
            }
        } else if (vm.map.getLMap().getZoom() < vm._layer._featureInfo.tryMinZoom ) {
            //current zoom is less than try minzoom. try feature is disabled
            return
        } else if (tryTimes <= vm._layer._featureInfo.tryBuffers.length) {
            buffer = vm._layer._featureInfo.tryBuffers[tryTimes - 1]
        } else {
            //run out of try times
            return
        }
        
        if (!params) {
            //use buffer to create a bbox around the click point, and use the bbox to get features from kmi 
            var topLeft = vm.map.getLMap().layerPointToLatLng([ev.layerPoint.x - buffer,ev.layerPoint.y - buffer])
            var bottomRight = vm.map.getLMap().layerPointToLatLng([ev.layerPoint.x + buffer,ev.layerPoint.y + buffer])
            params = "bbox=" + bottomRight.lat + "," + topLeft.lng + "," + topLeft.lat + "," + bottomRight.lng
        }

        var currentLayer = vm._layer
        
        vm._layer.getFeatures(params,function (totalFeatures,features) {
            if (totalFeatures < 1) {
                if (vm.map.getLMap().getZoom() >= vm._layer._featureInfo.tryMinZoom ) {
                    vm._showFeatureInfo(ev,tryTimes + 1)
                } 
                return
            }
            if (currentLayer != vm._layer) {
                //layer changed, ignore
                return
            }
            var feat = features[0]
            //populate the feature info
            if (vm._layer._featureInfo["__popupHtmlElement"] === undefined || vm._layer._featureInfo["__popupHtmlElement"] === null) {
                //initialize properties
                vm._layer._featureInfo["__properties"] = []

                if (vm._layer._featureInfo.excluded_properties) {
                    $.each(feat.properties,function(k,v){
                        if (vm._layer._featureInfo.excluded_properties.find(function(prop){return prop === k})) {
                            //excluded
                            return
                        } else {
                            var prop = vm._layer._featureInfo.properties.find(function(prop){return prop.name === k})
                            if (prop) {
                                //included
                                vm._layer._featureInfo["__properties"].push(prop)
                            } else if (["ogc_fid","md5_rowhash"].indexOf(k.toLowerCase()) >= 0 ) {
                                //automatically excluded
                                return
                            } else {
                                //automatically included
                                vm._layer._featureInfo["__properties"].push({"name":k,"title":k.camelize()})
                            }
                        }
                    })
                } else if (vm._layer._featureInfo.properties) {
                    $.each(vm._layer._featureInfo.properties,function(index,prop){
                        if (prop["name"] in feat.properties) {
                            vm._layer._featureInfo["__properties"].push(prop)
                        }
                    })
                } else {
                    $.each(feat.properties,function(k,v){
                        if (["ogc_fid","md5_rowhash"].indexOf(k.toLowerCase()) >= 0 ) {
                            //automatically excluded
                            return
                        }
                        vm._layer._featureInfo["__properties"].push({"name":k,"title":k.camelize()})
                    })
                }
                
                var get_style = function(element) {
                    if (vm._layer._featureInfo["infostyle"] && vm._layer._featureInfo["infostyle"][element]) {
                        return " style=\"" + vm._layer._featureInfo["infostyle"][element] + "\" "
                    } else {
                        return ""
                    }
                }
                var msg = null;
                msg = "<div class='gokart_feature_info'><table" + get_style("table") + ">"
                msg += "<tbody" + get_style("tbody") + ">"
                $.each(vm._layer._featureInfo["__properties"],function(index,prop){
                    if (prop["name"] in feat.properties) {
                        msg += "<tr" + get_style("tbody.tr") + "><th" + get_style("tbody.th") + ">" + prop["title"] + "</th><td id=\"featureinfo_" + prop["name"] + "\"" + get_style("tbody.td") + "></td></tr>"
                    }
                })
                msg += "</tbody>"
                msg += "<tfoot" + get_style("tfoot") + "><tr id='featureinfo_navigator' class='featureinfo_navigator'" + get_style("tfoot.tr") + "><td colspan='2'" + get_style("tfoot.td") + ">"
                msg += "<img id='featureinfo_navigator_previous' class='featureinfo_navigator_button' src='" + vm.map.gokart.env["gokartService"] + "/dist/static/images/previous.svg'> <span id='featureinfo_current_index'></span>/<span id='featureinfo_size'></span> <img id='featureinfo_navigator_next' class='featureinfo_navigator_button' src='" + vm.map.gokart.env["gokartService"] + "/dist/static/images/next.svg'>"
                msg += "</td></tr></tfoot>"
                msg += "</table></div>"

                vm._layer._featureInfo["__popupHtmlElement"] = $($.parseHTML(msg))
            }
            if (vm._setPopupContent) {
                vm._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_navigator_previous").on("click",function(ev){
                    ev.stopPropagation()
                    if (vm._featIndex <= 0) {
                        vm.selectFeature(vm._featsSize - 1)
                    } else {
                        vm.selectFeature(vm._featIndex - 1)
                    }
                })
                vm._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_navigator_next").on("click",function(ev){
                    ev.stopPropagation()
                    if (vm._featIndex >= vm._featsSize) {
                        vm.selectFeature(0)
                    } else {
                        vm.selectFeature(vm._featIndex + 1)
                    }
                })
                vm._popup.setContent(vm._layer._featureInfo["__popupHtmlElement"].get(0))
            }
            $.each(features,function(index,feat) {
                if (index >= vm._feats.length) {
                    vm._feats.push({"properties":{}})
                }
                $.each(vm._layer._featureInfo["__properties"],function(index2,prop){
                    if (feat.properties[prop["name"]] === null || feat.properties[prop["name"]] === undefined) {
                       vm._feats[index]["properties"][prop["name"]] = null
                    } else {
                        var value = feat.properties[prop["name"]]
                        try {
                            if (!value) {
                                value = ""
                            } else if ("precision" in prop) {
                                value = parseFloat(value).toFixed(parseInt(prop["precision"]))
                            }
                        } catch (ex) {
                            //ignore exception
                        }
                        vm._feats[index]["properties"][prop["name"]] = value
                    }
                })
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
                //set the position
                if (vm._layer._featureInfo["position"] === "event") {
                    vm._feats[index]["position"] = ev.latlng
                } else {
                    var northPoint = null
                    vm._getPosition = vm._getPosition || function(latlngs,position,referenceLatlng) {
                        var point = null
                        $.each(latlngs,function(i,latlng){
                            if (Array.isArray(latlng)) {
                                latlng = vm._getPosition(latlng,position)
                            }
                            if (point === null) {
                                point = latlng
                            } else if(position === "north") {
                                if (point.lat < latlng.lat) {
                                    point = latlng
                                }
                            } else if(position === "south") {
                                if (point.lat > latlng.lat) {
                                    point = latlng
                                }
                            } else  {
                                throw "Position '" + position + "' does not support."
                            }
                        })
                        return point
                    }
                    vm._feats[index]["position"] = vm._getPosition(vm._feats[index]["geometry"].getLatLngs(),"north") || ev.latlng
                }
            })
            vm._featsSize = features.length
            if (vm._featsSize < 2) {
                vm._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_navigator").hide()
            } else {
                vm._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_navigator").show()
            }
            vm.selectFeature(0)
        })

    }
    if (enable && !this._enabled ) {
        //try to enable it
        if (!this._layer) {
            throw "Layer is null"
        }
        this.map.getMapElement().css("cursor","pointer")
        this.map.getLMap().on(this._eventType,this._showFeatureInfo)
        this._enabled = true
    } else if (!enable && this._enabled) {
        this.clear()
        this.map.getMapElement().css("cursor","")
        this.map.getLMap().off(this._eventType,this._showFeatureInfo)
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
            if (this._layer._featureInfo["__popupHtmlElement"]) {
                this._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_navigator_previous").off("click")
                this._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_navigator_next").off("click")
            }
            this.clear()
        }
        this._layer = layer
        this._layer._featureInfo = this._layer._featureInfo || {}
        if (!this._layer._featureInfo["initialized"]) {
            this._layer._featureInfo["initialized"] = true
            this._layer._featureInfo["cache"] = this._layer._featureInfo["cache"] || false
            this._layer._featureInfo["tryMinZoom"] = parseInt(this._layer._featureInfo["tryMinZoom"]) || 999
            //initialize tryBuffers
            if (this._layer._featureInfo["tryBuffers"]) {
                if (!Array.isArray(this._layer._featureInfo["tryBuffers"])) {
                    this._layer._featureInfo["tryBuffers"] = [this._layer._featureInfo["tryBuffers"]]
                }
                for(var index = 0;index < this._layer._featureInfo["tryBuffers"].length;index++) {
                    this._layer._featureInfo["tryBuffers"][index] = parseInt(this._layer._featureInfo["tryBuffers"][index])
                }
            } else {
                this._layer._featureInfo["tryBuffers"] = [10]
            }
            this._layer._featureInfo["position"] = this._layer._featureInfo["position"] || "event" //current,support 'auto' and 'event'
            this._layer._featureInfo["css"] = this._layer._featureInfo["css"] || {}
            if (this._layer._featureInfo["properties"]) {
                for(var index = 0;index < this._layer._featureInfo["properties"].length;index++) {
                    if (typeof this._layer._featureInfo["properties"][index] === "string") {
                        this._layer._featureInfo["properties"][index] = {"name":this._layer._featureInfo["properties"][index],"title":this._layer._featureInfo["properties"][index].camelize()}
                    }
                    if (!(this._layer._featureInfo["properties"][index]["title"])) {
                        this._layer._featureInfo["properties"][index]["title"] = this._layer._featureInfo["properties"][index]["name"].camelize()
                    }
                }
            }
        }
        var options = $.extend({},this._popupOptions,this._layer._featureInfo["popup_options"] || {})
        var vm = this
        if (this._layer._featureInfo.buttons) {
            options["buttons"] =[]
            if (this._layer._featureInfo.buttons.indexOf("clear") >= 0 && this._layer._featureInfo["cache"]) {
                options["buttons"].push([vm.map.gokart.env["gokartService"] + "/dist/static/images/clear.svg",function(ev){
                    ev.stopPropagation()
                    vm.clear()
                }])
            }
        }
        this._popup = L.popup(options)
        this._setPopupContent = true
        this._feats.length = 0
        this._featsSize = 0
        this._featIndex = -1
        this.enable(true)
    } else {
        // disable this interaction, but keep the last layer.
        this.enable(false)
    }
}
//clear the feature info,retrieved from the backend.
FeatureInfo.prototype.clear = function() {
    //clear the feature info,retrieved from the backend.
    if (this._layer._featureInfo["highlight"]) {
        if (this._featIndex >= 0 && this._layer._featureInfo["cache"]) {
            this._feats[this._featIndex]["geometry"].closePopup()
            this._feats[this._featIndex]["geometry"].unbindPopup()
        } else if (this._popup.isOpen()) {
            this._popup.remove()
        }

        if (this._featIndex >= 0) {
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
FeatureInfo.prototype.selectFeature = function(index) {
    if (index < 0 || index >= this._featsSize) {
        index = 0
    }
    if (!this._layer || !this._layer._featureInfo["__popupHtmlElement"]) return

    var vm = this
    //replace the content
    $.each(this._feats[index]["properties"],function(k,v){
        vm._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_" + k).text((v===null)?"":v)
    })
    if (this._featsSize > 1) {
        vm._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_size").text(this._featsSize)
        vm._layer._featureInfo["__popupHtmlElement"].find("#featureinfo_current_index").text(index + 1)
    }
    if (index === this._featIndex) {
        //choose the same feature
        if (this._layer._featureInfo.highlight && this._layer._featureInfo["cache"]) {
            this._feats[index]["geometry"].openPopup(this._feats[index]["position"])
        } else {
            this._popup.setLatLng(this._feats[index]["position"])
            if (!this._popup.isOpen()) {
                this._popup.openOn(this.map.getLMap())
            }
        }
    } else {
        if (this._layer._featureInfo.highlight) {
            if (this._featIndex >= 0) {
                if (this._layer._featureInfo["cache"]) {
                    this._feats[this._featIndex]["geometry"].unbindPopup()
                }
                this._feats[this._featIndex]["geometry"].remove()
            }
            this._feats[index]["geometry"].addTo(this.map.getLMap())
            if (this._layer._featureInfo["cache"]) {
                this._feats[index]["geometry"].bindPopup(this._popup)
                this._feats[index]["geometry"].openPopup(this._feats[index]["position"])
            } else {
                this._popup.setLatLng(this._feats[index]["position"])
                if (!this._popup.isOpen()) {
                    this._popup.openOn(this.map.getLMap())
                }
            }
        } else {
            this._popup.setLatLng(this._feats[index]["position"])
            if (!this._popup.isOpen()) {
                this._popup.openOn(this.map.getLMap())
            }
        }
        this._featIndex = index
    }
}


export {FeatureInfo}
