'use strict';

var ejs = require('elastic.js');
var Boom = require('boom');
var gjv = require('geojson-validation');
var err = require('./errors.js')

var legacyParams = function (params, q, limit) {
  var supported_query_re = new RegExp('^[0-9a-zA-Z#\*\.\_\:\(\)\"\\[\\]\{\}\\-\\+\>\<\= ]+$');

  if (params.search) {
    if (!supported_query_re.test(params.search)) {
      err.searchNotSupportedError(params.search);
    }

    q.query(ejs.QueryStringQuery(params.search));
  } else if (params.count) {
    q.facet(ejs.TermsFacet('count').fields([params.count]).size(limit));
  }

  return q;
};

module.exports = function (params, q, limit) {
  var query = ejs.BoolQuery();

  // Do legacy search
  if (params.search || params.count) {
    return legacyParams(params, q, limit);
  };

  if (params.contains) {
    var correct_query = new RegExp('^[0-9\.\,\-]+$');
    if (correct_query.test(params.contains)) {
      var coordinates = params.contains.split(',');
      coordinates = coordinates.map(parseFloat);

      var shape = ejs.Shape('circle', coordinates).radius('1km');

      query = query.should(ejs.GeoShapeQuery()
                              .field('boundingBox')
                              .shape(shape));
    } else {
      err.incorrectCoordinatesError(params.contains);
    }
  }

  if (params.intersects) {
    try {
      var geojson = JSON.parse(params.intersects);
    } catch (e) {
      err.invalidGeoJsonError();
    }

    if (gjv.valid(geojson)) {

      if (geojson.type === 'FeatureCollection') {
        for (var i=0; i < geojson.features.length; i++) {
          var feature = geojson.features[i];
          var shape = ejs.Shape(feature.geometry.type, feature.geometry.coordinates);
          query = query.should(ejs.GeoShapeQuery()
                                  .field('boundingBox')
                                  .shape(shape));
        }
      } else {
        var shape = ejs.Shape(geojson.geometry.type, geojson.geometry.coordinates);
        query = query.should(ejs.GeoShapeQuery()
                                .field('boundingBox')
                                .shape(shape));
      }
    } else {
      err.invalidGeoJsonError();
    }
  }

  return q.query(query);
};
