import Map from './components/map.js'
import {getCRS} from './components/crs.js'
import {Layer} from './components/layer.js'

var gokart = {};

gokart.Map = Map;
gokart.Layer = Layer;
gokart.getCRS = getCRS;

gokart.initialize = function(mapId) {
    //initialize gokartEnv
    $.each([["publicWmtsService","wmtsService"],["publicWmsService","wmsService"],["publicWfsService","wfsService"]],function(index,config){
        if (!gokartEnv[config[0]]) {
            gokartEnv[config[0]] = gokartEnv[config[1]]
        }
    })

    $.ajax({
        url: gokartEnv.whoamiUrl,
        method:"GET",
        dataType:"json",
        success: function (response, stat, xhr) {
            gokart.user = response
            gokart.user["authenticated"] = gokart.user["session_key"]?true:false
            gokart.map = new gokart.Map(mapId,gokart.user)
        },
        error: function (xhr,status,message) {
            gokart.user = {authenticated:false}
            gokart.map = new gokart.Map(mapId,gokart.user)
        },
        xhrFields: {
          withCredentials: true
        }
    })
}

export  default gokart
