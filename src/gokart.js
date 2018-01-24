import Map from './components/map.js'
import {getCRS} from './components/crs.js'
import {Layer} from './components/layer.js'

var gokart = {};

gokart.Map = Map;
gokart.Layer = Layer;
gokart.getCRS = getCRS;

gokart.initialize = function(mapId) {
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
