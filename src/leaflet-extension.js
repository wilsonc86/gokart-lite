import L from 'leaflet/dist/leaflet-src.js'
import $ from 'jquery'
import {utils} from 'src/vendor.js'

//use 1024 as the tile size
L.CRS.EPSG4326.scale = function(zoom) {
    return 1024 * Math.pow(2, zoom);
}
L.CRS.EPSG4326.zoom = function(scale) {
    return Math.log(scale / 1024) / Math.LN2;
}

L.Map.prototype.setSize = function(width,height) {
    if (width) {
        $(this._container).width(width)
    } else {
        $(this._container).width("100%")
    }
    if (height) {
        $(this._container).height(height)
    } else {
        $(this._container).height("100%")
    }
    var center = this.getCenter()
    var zoom = this.getZoom()
    this.invalidateSize(); 
    this.setView(center,zoom)
}

//add extra buttons on  the left of close button
L.popup = function(){
    var func = L.popup;
    return function(options,source) {
        var _popup = func(options,source)
        _popup._initLayout = function() {
            var func1 = _popup._initLayout
            return function() {
                func1.call(this)
                if (this.options.buttons && this.options.buttons.length > 0) {
                    var buttonDiv = $($.parseHTML("<div class='leaflet-popup-custom-buttons'></div>"))
                    var button = null
                    $.each(this.options.buttons,function(index,b){
                        button = $($.parseHTML("<img src='" +b[0] + "' class='leaflet-popup-custom-button' title='Erase feature info from map'/>"))
                        button.on("click",b[1])
                        buttonDiv.append(button)
                    })
                    $(this._container).append(buttonDiv)
                }
            }
        }()
        return _popup
    }
}()


L.Control.Fullscreen = L.Control.extend({
    options: {
        position:"topright"
    },
    onAdd:function(map) {
        L.DomEvent.on(this._button,"click",this._onclick)

        return this._button;
    },

    onRemove:function(map) {
        if (this._listener) {
            L.DomEvent.off(img,"click",this._onclick)
        }
    },
    isFullscreen:function() {
        return this._fullscreen
    },
    toggleFullscreen:function() {
        if (this._fullscreen) {
            $(this._map._container).css({
                position:"relative",
                width:"100%",
                height:"100%",
                padding:"0px 0px 0px 0px",
                margin:"0px 0px 0px 0px",
                top:"0px",
                left:"0px"
            })
            this._button.src = gokartEnv.gokartService + '/dist/static/images/to-fullscreen.svg'
        } else if (this.options["fullscreenStyle"]) {
            $(this._map._container).css(this.options["fullscreenStyle"])
        } else {
            $(this._map._container).css({
                position:"absolute",
                top:"0px",
                left:"0px",
                width:"100%",
                height:"100%",
                padding:"0px 0px 0px 0px",
                margin:"0px 0px 0px 0px",
            })
            this._button.src = gokartEnv.gokartService + '/dist/static/images/exit-fullscreen.svg'
        }
        var center = this._map.getCenter()
        var zoom = this._map.getZoom()
        this._map.invalidateSize(); 
        this._map.setView(center,zoom)
        this._fullscreen = !this._fullscreen
    }
})

L.Control.Fullscreen.addInitHook(function() {
    this._fullscreen = false
    var vm = this
    this._button = L.DomUtil.create('img');
    this._button.src = gokartEnv.gokartService + '/dist/static/images/to-fullscreen.svg';
    this._button.id = "fullscreen_control";


    this._onclick = this._onclick || function(ev) {
        vm.toggleFullscreen()
    }
    L.DomEvent.disableClickPropagation(this._button)
})

L.control.fullscreen = function(opts) {
    if (opts === undefined || opts === null) {
        opts = (gokartEnv.fullscreenControl && gokartEnv.fullscreenControl.options)?gokartEnv.fullscreenControl.options:{}
    } 
    return new L.Control.Fullscreen(opts)
}

export default L
