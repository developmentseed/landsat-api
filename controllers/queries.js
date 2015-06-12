'use strict';

var ejs = require('elastic.js');
var Boom = require('boom');
var gjv = require("geojson-validation");

var legacyParams = function (params, q, limit) {
  var err;
  var supported_query_re = new RegExp('^[0-9a-zA-Z#\*\.\_\:\(\)\"\\[\\]\{\}\\-\\+\>\<\= ]+$');

  if (params.search) {
    if (!supported_query_re.test(params.search)) {
      err = Boom.create(400, 'Search not supported: ' + params.search, { timestamp: Date.now() });
      throw err;
    }

    q.query(ejs.QueryStringQuery(params.search));
  } else if (params.count) {
    q.facet(ejs.TermsFacet('count').fields([params.count]).size(limit));
  }

  return q;
};

module.exports = function (params, q, limit) {
  var err;
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
      err = Boom.create(
        400,
        'Incorrect coordinates: ' + params.contains + '. Only digits, dot, minus and comma are allowd.',
        { timestamp: Date.now() }
      );
      throw err;
    }
  }

  if (params.intersects) {
    var geojson = JSON.parse(params.intersects);
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
    }
  }

  return q.query(query);
};
