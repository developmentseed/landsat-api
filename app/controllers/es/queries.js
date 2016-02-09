'use strict';

var ejs = require('elastic.js');
var _ = require('lodash');
var turfArea = require('turf-area');
var turfExtent = require('turf-extent');
var gjv = require('geojson-validation');
var err = require('../../libs/errors.js');
var tools = require('../../libs/shared.js');

/**
 * @apiDefine search
 * @apiParam {string} [search] Supports Lucene search syntax for all available fields
 * in the landsat meta data. <br> If search is used, all other parameters are ignored.
**/
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
  query = query.should(ejs.GeoShapeQuery()
                          .field('boundingBox')
                          .shape(shape));
  return query;
}

/**
 * @apiDefine contains
 * @apiParam {string} [contains] Evaluates whether the given point is within the
 * bounding box of a landsat image.
 *
 * Accepts `latitude` and `longitude`. They have to be separated by a `,`
 * with no spaces in between. Example: `contains=23,21`
**/
var contains = function (params, query) {
  var correct_query = new RegExp('^[0-9\.\,\-]+$');
  if (correct_query.test(params)) {
    var coordinates = params.split(',');
    coordinates = coordinates.map(parseFloat);

    if (coordinates[0] < -180 || coordinates[0] > 180) {
      return err.incorrectCoordinatesError(params);
    }

    if (coordinates[1] < -90 || coordinates[1] > 90) {
      return err.incorrectCoordinatesError(params);
    }

    var shape = ejs.Shape('circle', coordinates).radius('1km');

    query = query.must(ejs.GeoShapeQuery()
                            .field('boundingBox')
                            .shape(shape));
    return query;
  } else {
    err.incorrectCoordinatesError(params);
  }
};

/**
 * @apiDefine intersects
 * @apiParam {string/geojson} [intersects] Evaluates whether the give geojson is intersects
 * with any landsat images.
 *
 * Accepts valid geojson.
**/
var intersects = function (params, query) {
  // if we receive an object, assume it's GeoJSON, if not, try and parse
  var geojson = tools.parseGeoJson(params);

  if (gjv.valid(geojson)) {
    // If it is smaller than Nigeria use geohash
    if (tools.areaNotLarge(geojson)) {
      if (geojson.type === 'FeatureCollection') {
        for (var i=0; i < geojson.features.length; i++) {
          var feature = geojson.features[i];
          query = geojsonQueryBuilder(feature, query);
        }
      } else {
        query = geojsonQueryBuilder(geojson, query);
      }
    } else {
      // Query for min and max lat and long
      var bbox = turfExtent(geojson);
      query = rangeQuery(bbox[0], bbox[2], 'sceneCenterLongitude', query)
      query = rangeQuery(bbox[1], bbox[3], 'sceneCenterLatitude', query)
    }

    return query
  } else {
    err.invalidGeoJsonError();
  }
};

/**
 * @apiDefine rangeFields
 * @apiParam {string} [date_from] The lower limit for `acquisitionDate` field.
 * Returns all records with `acquisitionDate` after this date. <br>
 * Accepted format: `YYYY-MM-DD`.
 *
 * @apiParam {string} [date_to] The upper limit for `acquisitionDate` field.
 * Returns all records with `acquisitionDate` before this date. <br>
 * Accepted format: `YYYY-MM-DD`.
 *
 * @apiParam {string} [scene_start_time_from] The lower limit for `sceneStartTime` field.
 * Returns all records with `sceneStartTime` after this date. <br>
 * Accepted format: `YYYY-MM-DD`.
 *
 * @apiParam {string} [scene_start_time_to] The upper limit for `sceneStartTime` field.
 * Returns all records with `sceneStartTime` before this date. <br>
 * Accepted format: `YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss.ZZZ`.
 *
 * @apiParam {number} [cloud_from] The lower limit for `cloudCoverFull` field.
 * Returns all records with `cloudCoverFull` greater than this value.
 *
 * @apiParam {number} [cloud_to] The upper limit for `cloudCoverFull` field.
 * Returns all records with `cloudCoverFull` smaller than this value.
 *
 * @apiParam {number} [sun_azimuth_from] The lower limit for `sunAzimuth` field.
 * Returns all records with `sunAzimuth` greater than this value.
 *
 * @apiParam {number} [sun_azimuth_to] The upper limit for `sunAzimuth` field.
 * Returns all records with `sunAzimuth` smaller than this value.
 *
 * @apiParam {number} [sun_elevation_from] The lower limit for `sunElevation` field.
 * Returns all records with `sunElevation` greater than this value.
 *
 * @apiParam {number} [sun_elevation_to] The upper limit for `sunElevation` field.
 * Returns all records with `sunElevation` smaller than this value.
**/
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

/**
 * @apiDefine termFields
 * @apiParam {string} [scene_id] Performs exact search on `sceneID` field.
 * @apiParam {number} [row] Performs exact search on `row` field.
 * @apiParam {number} [path] Performs exact search on `path` field.
 * @apiParam {string} [sensor] Performs exact search on `sensor` field.
 * @apiParam {string} [receiving_station] Performs exact search on `receivingStation` field.
 * @apiParam {string="day","night"} [day_or_night=night] Performs exact search on `dayOrNight` field.
 *
**/
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
