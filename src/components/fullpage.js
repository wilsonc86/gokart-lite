import L from 'leaflet/dist/leaflet-src.js'
import $ from 'jquery'

L.Control.Fullpage = L.Control.extend({
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
            this._button.src = gokartEnv.gokartService + '/dist/static/images/to-fullpage.svg'
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
            this._button.src = gokartEnv.gokartService + '/dist/static/images/exit-fullpage.svg'
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
    this._button = L.DomUtil.create('img');
    this._button.src = gokartEnv.gokartService + '/dist/static/images/to-fullpage.svg';
    this._button.id = "fullpage_control";


    this._onclick = this._onclick || function(ev) {
        vm.toggleFullpage()
    }
    L.DomEvent.disableClickPropagation(this._button)
})

L.control.fullpage = function(opts) {
    if (opts === undefined || opts === null) {
        opts = (gokartEnv.fullpageControl && gokartEnv.fullpageControl.options)?gokartEnv.fullpageControl.options:{}
    } 
    return new L.Control.Fullpage(opts)
}

export default L
