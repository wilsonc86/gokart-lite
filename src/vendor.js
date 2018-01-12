// module for packaging up gokart's third-party dependencies

// produce some terrifying CSS at runtime using browserify-css
import 'foundation-sites/dist/foundation-flex.css'
import 'leaflet/dist/leaflet.css'

// jQuery v2, the krazy glue of the internet
import $ from 'jquery'
// OpenLayers 3 map widget, including our extensions
import L from 'leaflet'

import utils from './utils.js'

export {
  $,
  L,
  utils
}
