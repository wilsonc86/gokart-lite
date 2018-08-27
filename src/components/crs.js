import {
  L
} from 'src/vendor.js'

var _CRS_MAP = {
    "EPSG:4326":L.CRS.EPSG4326,
    "EPSG:3857":L.CRS.EPSG3857,
    "EPSG:3395":L.CRS.EPSG3395
}
var getCRS = function(crs){
    crs = (crs || "EPSG:4326").toUpperCase()
    if (crs in _CRS_MAP) {
        return _CRS_MAP[crs]
    } else {
        throw crs + " is not supported."
    }
}

export {getCRS}
