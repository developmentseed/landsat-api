'use strict';

var ejs = require('elastic.js');
var _ = require('lodash');
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

var rangeQuery = function (from, to, field, query) {

  if (from && to) {
    return query.must(ejs.RangeQuery(field).from(from).to(to));
  }

  if (from) {
    return query.must(ejs.RangeQuery(field).from(from));
  }

  if (to) {
    return query.must(ejs.RangeQuery(field).to(to));
  }
};

var termQuery = function (param, field, query) {
  return query.must(ejs.TermQuery(field, param));
};

module.exports = function (params, q, limit) {
  var query = ejs.BoolQuery();

  var rangeFields = [
    {
      from: 'date_from',
      to: 'date_to',
      field: 'acquisitionDate'
    },
    {
      from: 'scene_start_time_from',
      to: 'scene_start_time_to',
      field: 'sceneStartTime'
    },
    {
      from: 'scene_stop_time_from',
      to: 'scene_stop_time_to',
      field: 'sceneStopTime'
    },
    {
      from: 'cloud_from',
      to: 'cloud_to',
      field: 'cloudCoverFull'
    },
    {
      from: 'sun_azimuth_from',
      to: 'sun_azimuth_to',
      field: 'sunAzimuth'
    },
    {
      from: 'sun_elevation_from',
      to: 'sun_elevation_to',
      field: 'sunElevation'
    }
  ];

  var termFields = [
    {
      parameter: 'scene_id',
      field: 'sceneID'
    },
    {
      parameter: 'row',
      field: 'row'
    },
    {
      parameter: 'path',
      field: 'path'
    },
    {
      parameter: 'sensor',
      field: 'sensor'
    },
    {
      parameter: 'receiving_station',
      field: 'receivingStation'
    },
    {
      parameter: 'day_or_night',
      field: 'dayOrNight'
    }
  ]

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

  // Range search
  for (var i = 0; i < rangeFields.length; i++) {
    if (_.has(params, rangeFields[i].from) || _.has(params, rangeFields[i].to)) {

      query = rangeQuery(
        params[rangeFields[i].from],
        params[rangeFields[i].to],
        rangeFields[i].field,
        query
      );
    }
  }

  // Term search
  for (var i = 0; i < termFields.length; i++) {
    if (_.has(params, termFields[i].parameter)) {
      query = termQuery( params[termFields[i].parameter], termFields[i].field, query);
    }
  }

  return q.query(query);
};
