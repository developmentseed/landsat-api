'use strict';

var err = require('./errors.js')


var parseGeoJson = function (geojson) {
  // if we receive an object, assume it's GeoJSON, if not, try and parse
  if (typeof(geojson) === 'object') {
    return geojson;
  } else {
    try {
      return JSON.parse(geojson);
    } catch (e) {
      err.invalidGeoJsonError();
    }
  }
};

module.exports.parseGeoJson = parseGeoJson;

