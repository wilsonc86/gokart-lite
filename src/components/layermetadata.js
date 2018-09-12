import L from 'leaflet/dist/leaflet-src.js'


L.Control.LayerMetadata = L.Control.extend({
    options: {
        position:"bottomright"
    },
    setLayer:function(layer,refresh) {
        if (!layer) {
            this._layer = null
            this._div.innerHTML = ""
            if (this._map) {
                //remove from map
                this.remove()
            }
            return
        }
        if (this._layer === layer && !refresh) {
            //same layer
            return
        }
        this._layer = layer
        var vm = this
        if (this._layer._metadata) {
            if (typeof this._layer._metadata === 'function') {
                this._layer._metadata(function(html) {
                    vm._div.innerHTML = html
                    if (html) {
                        if (!this._map && this.map.getOption("layerMetadataControl")) {
                            //add to the map
                            this.addTo(this.map._map)
                        }
                    } else if (this._map) {
                        this.remove()
                    }
                })
            } else {
                this._div.innerHTML = this._layer._metadata
                if (!this._map && this.map.getOption("layerMetadataControl")) {
                    this.addTo(this.map._map)
                }
            }
        } else {
            this._div.innerHTML = ""
            if (this._map) {
                //remove from map
                this.remove()
            }
        }

    },
    onAdd:function(map) {
        var vm = this
        return this._div;
    },

})

L.Control.LayerMetadata.addInitHook(function() {
    var vm = this
    this._layer = null
    this._div = L.DomUtil.create('div');
    this._div.id = "layermetadata_control";
})

L.control.layerMetadata = function(map,opts) {
    if (opts === undefined || opts === null) {
        opts = (map.gokart.env["layerMetadataControl"] && map.gokart.env["layerMetadataControl"]["options"])?map.gokart.env["layerMetadataControl"]["options"]:{}
    } 
    var control = new L.Control.LayerMetadata(opts)
    control.map = map
    return control
}

export default L
