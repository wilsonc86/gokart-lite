import L from 'leaflet/dist/leaflet-src.js'


L.Control.FeatureCount = L.Control.extend({
    options: {
        position:"bottomleft"
    },
    setLayer:function(layer) {
        if (this._layer === layer) {
            //same layer
            return
        }
        this._featurecount = null
        this._layer = layer
        if (this._map) {
            //already add to the map
            this.getFeatureCount()
        }

    },
    getFeatureCount:function() {
        if (this._layer) {
            if (this._featurecount === null) {
                var vm = this
                var url = (vm._layer.requireAuth()?gokartEnv.wfsService:gokartEnv.publicWfsService) + "/wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=" + vm._layer.getId() + "&resultType=hits"
                $.ajax({
                    url:url,
                    dataType:"xml",
                    success: function (response, stat, xhr) {
                        try {
                            vm._featurecount = parseInt(response.firstChild.getAttribute("numberOfFeatures"))
                            if (vm._map) {
                                $(vm._map._container).find("#" + vm._featurecount_id).html(vm._featurecount)
                            }
                        } catch(msg) {
                            alert(msg)
                        }
                    },
                    error: function (xhr,status,message) {
                        alert(xhr.status + " : " + (xhr.responseText || message))
                    },
                    xhrFields: {
                        withCredentials: true
                    }
                })
            } else {
                $(this._map._container).find(this._featurecount_id).innerHTML = this._featurecount
            }
        } else {
            this._featurecount = null
            $(this._map._container).find(this._featurecount_id).innerHTML = ""
        }
    },
    onAdd:function(map) {
        var vm = this
        setTimeout(function(){vm.getFeatureCount()},500)
        return this._div;
    },

})

L.Control.FeatureCount.addInitHook(function() {
    var vm = this
    this._layer = null
    this._div = L.DomUtil.create('div');
    this._div.id = "featurecount_control";
    this._div.innerHTML = this.options["html"]
    this._featurecount_id = this.options["featurecount_id"] || "featurecount"
})

L.control.featureCount = function(opts) {
    if (opts === undefined || opts === null) {
        opts = (gokartEnv.featureCountControl && gokartEnv.featureCountControl.options)?gokartEnv.featureCountControl.options:{}
    } 
    return new L.Control.FeatureCount(opts)
}

export default L
