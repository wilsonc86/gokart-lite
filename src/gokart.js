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
        url: gokartEnv.gokartService + "/sso/auth",
        method:"GET",
        dataType:"json",
        success: function (response, stat, xhr) {
            gokart.user = response
            gokart.user["authenticated"] = true
            gokart.map = new gokart.Map(mapId,gokart.user)
        },
        error: function (xhr,status,message) {
            if (xhr.status === 401) {
                gokart.user = {authenticated:false}
                gokart.map = new gokart.Map(mapId,gokart.user)
            } else {
                alert("Get user profile failed.  " + (xhr.status || status) + " : " + (xhr.responseText || message))
            }
        },
        xhrFields: {
          withCredentials: true
        }
    })
}

export  default gokart
