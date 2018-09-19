import L from 'leaflet/dist/leaflet-src.js'
import './components/fullpage.js'
import './components/featurecount.js'
import './components/layermetadata.js'
import $ from 'jquery'

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

export default L
