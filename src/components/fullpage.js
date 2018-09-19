import L from 'leaflet/dist/leaflet-src.js'
import $ from 'jquery'

L.Control.Fullpage = L.Control.extend({
    options: {
        position:"topright"
    },
    onAdd:function(map) {
        if (!this._button.src) {
            this._button.src = this.map.gokart.env["gokartService"] + '/dist/static/images/to-fullpage.svg';
        }
        L.DomEvent.on(this._button,"click",this._onclick)

        return this._div;
    },

    onRemove:function(map) {
        if (this._listener) {
            L.DomEvent.off(img,"click",this._onclick)
        }
    },
    isFullpage:function() {
        return this._fullpage
    },
    toggleFullpage:function() {
        if (this._fullpage) {
            $(this._map._container).css({
                position:"relative",
                width:"100%",
                height:"100%",
                padding:"0px 0px 0px 0px",
                margin:"0px 0px 0px 0px",
                top:"0px",
                left:"0px"
            })
            this._button.src = this.map.gokart.env["gokartService"] + '/dist/static/images/to-fullpage.svg'
        } else if (this.options["fullpageStyle"]) {
            $(this._map._container).css(this.options["fullpageStyle"])
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
            this._button.src = this.map.gokart.env["gokartService"] + '/dist/static/images/exit-fullpage.svg'
        }
        var center = this._map.getCenter()
        var zoom = this._map.getZoom()
        this._map.invalidateSize(); 
        this._map.setView(center,zoom)
        this._fullpage = !this._fullpage
    }
})

L.Control.Fullpage.addInitHook(function() {
    this._fullpage = false
    var vm = this
    this._div = L.DomUtil.create('div')
    this._button = L.DomUtil.create('img');
    this._button.class = "gokart_fullpage_control";
    L.DomUtil.addClass(this._button,"gokart_fullpage_control")


    this._onclick = this._onclick || function(ev) {
        vm.toggleFullpage()
    }
    L.DomEvent.disableClickPropagation(this._button)
    $(this._div).append(this._button)
})

L.control.fullpage = function(map,opts) {
    if (opts === undefined || opts === null) {
        opts = (map.gokart.env["fullpageControl"] && map.gokart.env["fullpageControl"]["options"])?map.gokart.env["fullpageControl"]["options"]:{}
    } 
    var control = new L.Control.Fullpage(opts)
    control.map = map
    return control
}

export default L
