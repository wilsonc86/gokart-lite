import L from 'leaflet/dist/leaflet-src.js'


L.Control.FeatureCount = L.Control.extend({
    options: {
        position:"bottomleft"
    },
    setLayer:function(layer) {
        if (!layer) {
            this._layer = null
            this._div.innerHTML = ""
            this._featureCountId = "#featurecount"
            return
        }
        if (this._layer === layer) {
            //same layer
            return
        }
        this._featureCount = null
        this._layer = layer
        if (this._layer._featureCountControl && this._layer._featureCountControl.options && this._layer._featureCountControl.options.html) {
            this._featureCountId = null
            var vm = this
            if (typeof this._layer._featureCountControl.options["html"] === "function") {
                this._layer._featureCountControl.options["html"].call(this._layer,function(html){
                    vm._div.innerHTML = html
                    vm._featureCountId = "#" + (vm._layer._featureCountControl.options["featurecount_id"] || "featurecount")
                    if (vm._map) {
                        //already add to the map
                        vm.showFeatureCount()
                    }
                })
                return
            } else {
                this._div.innerHTML = this._layer._featureCountControl.options["html"]
                this._featureCountId = "#" + (this._layer._featureCountControl.options["featurecount_id"] || "featurecount")
            }
        }
        if (this._map) {
            //already add to the map
            this.showFeatureCount()
        }

    },
    showFeatureCount:function(refresh) {
        var vm = this
        if (this._layer) {
            this._layer.getFeatureCount(refresh,function(featurecount){
                $(vm._div).find(vm._featureCountId).html(featurecount)
            },function(msg){
                $(vm._div).find(vm._featureCountId).html(msg)
            })
        } else {
            $(this._div).find(vm._featureCountId).html("")
        }
    },
    onAdd:function(map) {
        var vm = this
        return this._div;
    },

})

L.Control.FeatureCount.addInitHook(function() {
    var vm = this
    this._layer = null
    this._div = L.DomUtil.create('div');
    this._div.id = "featurecount_control";
    this._featureCountId = null;
    if (this.options["html"]) {
        if (typeof this.options["html"] === "function") {
            var vm = this
            this.options["html"].call(this,function(html) {
                vm._div.innerHTML = html
                vm._featureCountId = "#" + (vm.options["featurecount_id"] || "featurecount")
            })
            return
        } else {
            this._div.innerHTML = this.options["html"]
            this._featureCountId = "#" + (this.options["featurecount_id"] || "featurecount")
        }
    } else {
        this._div.innerHTML = ""
        this._featureCountId = "#featurecount"
    }

})

L.control.featureCount = function(map,opts) {
    if (opts === undefined || opts === null) {
        opts = (map.gokart.env["featureCountControl"] && map.gokart.env["featureCountControl"]["options"])?map.gokart.env["featureCountControl"]["options"]:{}
    } 
    var control = new L.Control.FeatureCount(opts)
    control.map = map
    return control
}

export default L
