// produce some terrifying CSS at runtime using browserify-css
import 'leaflet/dist/leaflet.css'

// OpenLayers 3 map widget, including our extensions
import L from './leaflet-extension.js'
import $ from 'jquery'

import utils from './utils.js'

String.prototype.camelize = function(separator) {
 
  // Assume separator is _ if no one has been provided.
  if(typeof(separator) == "undefined") {
    separator = "_";
  }
 
  // Cut the string into words
  var words = this.split(separator);
 
  // Concatenate all capitalized words to get camelized string
  var result = "";
  var word = null;
  var capitalizedWord = null;
  for (var i = 0 ; i < words.length ; i++) {
    word = words[i].trim();
    if (word.length === 0) continue;
    if (["km","ha","mile","knot"].indexOf(word) >= 0) {
        capitalizedWord = " (" + word + ")"
    } else {
        capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
        if (result.length > 0) {
            capitalizedWord = " " + capitalizedWord;
        }
    }
    result += capitalizedWord;
  }
 
  return result;
}
export {
  $,
  L,
  utils
}
