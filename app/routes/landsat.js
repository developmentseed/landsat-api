'use strict';

var _ = require('lodash');
var Boom = require('boom');
var landsat = require('../controllers/landsat.js');


/**
 * @api {get} /landsat Landsat Meta Data Search
 * @apiName getLandsatMeta
 * @apiGroup landsat
 * @apiVersion 1.0.0
 *
 * @apiDescription This is the only end-point of landsat-api. Through this end-point
 * you can search and query landsat meta data. It supports both `GET` and `POST` requests.
 *
 * @apiParam {string} [contains] Evaluates whether the given point is within the
 * bounding box of a landsat image.
 *
 * Accepts `latitude` and `longitude`. They have to be separated by a `,`
 * with no spaces in between. Example: `contains=23,21`
 *
 * @apiParam {string/geojson} [intersects] Evaluates whether the give geojson is intersects
 * with any landsat images.
 *
 * Accepts valid geojson.
 *
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
 *
 * @apiParam {string} [scene_id] Performs exact search on `sceneID` field.
 *
 * @apiParam {number} [row] Performs exact search on `row` field.
 *
 * @apiParam {number} [path] Performs exact search on `path` field.
 *
 * @apiParam {string} [sensor] Performs exact search on `sensor` field.
 *
 * @apiParam {string} [receiving_station] Performs exact search on `receivingStation` field.
 *
 * @apiParam {string="day","night"} [day_or_night=night] Performs exact search on `dayOrNight` field.
 *
 * @apiParam {number} [limit=1] Limit the results.
 *
 * @apiParam {number} [page=1] Paginate through results.
 *
 * @apiParam {number} [skip] Number of records to skip.
 *
 * @apiParam {string} [search] Supports Lucene search syntax for all available fields
 * in the landsat meta data. <br> If search is used, all other parameters are ignored.
 *
 * @apiSuccess {string} firstname Firstname of the User.
 * @apiSuccess {string} lastname  Lastname of the User.
 */
module.exports = [
  {
    method: ['GET', 'POST'],
    path: '/landsat',
    handler: function (request, reply) {
      var params = {};

      // For GET
      if (request.query) {
        params = request.query;
      }

      // For POST
      if (request.payload) {
        params = request.payload;

        //Crude hack for pagination lack of support for POST
        if (_.has(request.payload, 'page')) {
          request.page = _.parseInt(request.payload.page);
          request.payload = _.omit(request.payload, 'page');
        }

        if (_.has(request.payload, 'limit')) {
          request.limit = _.parseInt(request.payload.limit);
          request.payload = _.omit(request.payload, 'limit');
        }
      }

      // Send for processing
      landsat(params, request, function (err, records, count) {
        if (err) {
          request.log(err);
          return reply(err);
        }

        request.count = count;
        return reply(records);
      });

    }
  }
];
