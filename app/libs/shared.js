'use strict';

var err = require('./errors.js');
var turfArea = require('turf-area');
var validator = require('validator');
var areaLimit;

var parseGeoJson = function (geojson) {
  // if we receive an object, assume it's GeoJSON, if not, try and parse
  if (typeof geojson === 'object') {
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

var areaNotLarge = function (geojson) {
  if (validator.isNumeric(process.env.AREA_LIMIT)) {
    areaLimit = parseInt(process.env.AREA_LIMIT, 10);
  } else {
    areaLimit = 500000;
  }

  // calculate area
  var area = turfArea(geojson) / 1000000;

  // If it is smaller than Nigeria use geohash
  if (area < areaLimit) {
    return true;
  } else {
    return false;
  }
};

module.exports.areaNotLarge = areaNotLarge;

// This is a custom key generation function for hapi cache system
var customGenerateKey = function (params, request) {
  return request.url.path + '?' + JSON.stringify(params);
};

module.exports.customGenerateKey = customGenerateKey;
