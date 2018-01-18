// produce some terrifying CSS at runtime using browserify-css
import 'leaflet/dist/leaflet.css'

// OpenLayers 3 map widget, including our extensions
import L from 'leaflet'
import $ from 'jquery'

import utils from './utils.js'
//use 1024 as the tile size
L.CRS.EPSG4326.scale = function(zoom) {
    return 1024 * Math.pow(2, zoom);
}
L.CRS.EPSG4326.zoom = function(scale) {
    return Math.log(scale / 1024) / Math.LN2;
}
export {
  $,
  L,
  utils
}
