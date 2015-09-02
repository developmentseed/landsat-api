'use strict';

var _ = require('lodash');
var moment = require('moment');
var compile = require('monquery');
var turfArea = require('turf-area');
var turfExtent = require('turf-extent');
var gjv = require('geojson-validation');
var validator = require('validator');
var err = require('../../libs/errors.js');
var tools = require('../../libs/shared.js');

/**
 * @apiDefine search
 * @apiParam {string} [search] Supports Lucene search syntax for all available fields
 * in the landsat meta data. <br> If search is used, all other parameters are ignored.
**/
var legacyParams = function (params) {
  var supported_query_re = new RegExp('^[0-9a-zA-Z#\*\.\_\:\(\)\"\\[\\]\{\}\\-\\+\>\<\= ]+$');

  if (!supported_query_re.test(params.search)) {
    err.searchNotSupportedError(params.search);
  }

  return compile(params.search);
};

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
    var coordinates = params.split(',').map(parseFloat);

    query.boundingBox = {
       $geoIntersects: {
          $geometry: {
             type: 'Point',
             coordinates: coordinates
          }
       }
    };

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

    // Check Area
    if (tools.areaNotLarge(geojson)) {
      var geometry;
      if (geojson.type === 'FeatureCollection') {
        query['$or'] = [];
        for (var i=0; i < geojson.features.length; i++) {
          geometry = geojson.features[i].geometry;
          query['$or'].push({ boundingBox: {$geoIntersects: { $geometry: geometry } } })
        }
      }
      else {
        geometry = geojson.geometry;
        query.boundingBox = { $geoIntersects: { $geometry: geometry } };
      }

    } else {
      var bbox = turfExtent(geojson);
      query.sceneCenterLatitude = {$gte: bbox[1], $lte: bbox[3]};
      query.sceneCenterLongitude = {$gte: bbox[0], $lte: bbox[2]};
    }
    return query;
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
  if (field in ['acquisitionDate', 'sceneStartTime', 'sceneStopTime']) {
    if (to) to = moment(to).format();
    if (from) from = moment(from).format();
  }
  else {
    if (validator.isNumeric(to)) to = parseFloat(to);
    if (validator.isNumeric(from)) from = parseFloat(from);
  }

  if (from && to) {
    query[field] = {$gte: from, $lte: to};
    return query;
  }

  if (from) {
    query[field] = {$gte: from};
    return query;
  }

  if (to) {
    query[field] = {$lte: to};
    return query;
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
  query[field] = param;
  return query;
};

module.exports = function (params, query, limit) {
  // if search parameters included ignore other parameters and do legacy search
  if (params.search) {
    return legacyParams(params);
  }

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
  ];

  // Do legacy search
  if (params.search || params.count) {
    return legacyParams(params, q, limit);
  }

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
  for (i = 0; i < termFields.length; i++) {
    if (_.has(params, termFields[i].parameter)) {
      query = termQuery(params[termFields[i].parameter], termFields[i].field, query);
    }
  }

  return query;
};
