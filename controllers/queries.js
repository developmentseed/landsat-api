'use strict';

var ejs = require('elastic.js');
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

var geojsonQueryBuilder = function (feature, query) {
  var shape = ejs.Shape(feature.geometry.type, feature.geometry.coordinates);
  query = query.must(ejs.GeoShapeQuery()
                          .field('boundingBox')
                          .shape(shape));
  return query;
}

var contains = function (params, query) {
  var correct_query = new RegExp('^[0-9\.\,\-]+$');
  if (correct_query.test(params)) {
    var coordinates = params.split(',');
    coordinates = coordinates.map(parseFloat);

    var shape = ejs.Shape('circle', coordinates).radius('1km');

    query = query.must(ejs.GeoShapeQuery()
                            .field('boundingBox')
                            .shape(shape));
    return query;
  } else {
    err.incorrectCoordinatesError(params);
  }
};

var intersects = function (params, query) {
  try {
    var geojson = JSON.parse(params);
  } catch (e) {
    err.invalidGeoJsonError();
  }

  if (gjv.valid(geojson)) {

    if (geojson.type === 'FeatureCollection') {
      for (var i=0; i < geojson.features.length; i++) {
        var feature = geojson.features[i];
        query = geojsonQueryBuilder(feature, query);
      }
    } else {
      query = geojsonQueryBuilder(geojson, query);
    }

    return query;
  } else {
    err.invalidGeoJsonError();
  }
};

var acquisitionFilter = function (params, query) {

  if (params.date_from && params.date_to) {
    return query.must(ejs.RangeQuery('acquisitionDate').from(params.date_from).to(params.date_to));
  }

  if (params.date_from) {
    return query.must(ejs.RangeQuery('acquisitionDate').from(params.date_from));
  }

  if (params.date_to) {
    return query.must(ejs.RangeQuery('acquisitionDate').to(params.date_to));
  }
};

module.exports = function (params, q, limit) {
  var query = ejs.BoolQuery();

  // Do legacy search
  if (params.search || params.count) {
    return legacyParams(params, q, limit);
  };

  if (params.contains) {
    query = contains(params.contains, query);
  }

  if (params.intersects) {
    query = intersects(params.intersects, query);
  }

  if (params.date_from || params.date_to) {
    query = acquisitionFilter(params, query);
  }

  if (params.scene_start_time_from) {

  }

  if (params.scene_start_time_to) {

  }

  if (params.cloud_from) {

  }

  if (params.cloud_to) {

  }

  if (params.scene_id) {

  }

  if (params.row) {

  }

  if (params.path) {

  }

  if (params.day_or_night) {

  }

  if (params.sensor) {

  }

  if (params.sun_azimuth_from) {

  }

  if (params.sun_azimuth_to) {

  }

  if (params.sun_elevation_from) {

  }

  if (params.sun_elevation_to) {

  }

  if (params.receiving_station) {

  }

  console.log(JSON.stringify(query.toJSON()));

  return q.query(query);
};
