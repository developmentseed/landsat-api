'use strict';

var _ = require('lodash');
var Boom = require('boom');
var es = require('../controllers/es/landsat.js');
var mongo = require('../controllers/mongo/landsat.js');
var landsat;

/**
 * @api {get} /landsat GET
 * @apiName getLandsatMeta
 * @apiGroup API
 * @apiVersion 1.0.0
 *
 * @apiDescription This is the only end-point of landsat-api. Through this end-point
 * you can search and query landsat meta data. It supports both `GET` and `POST` requests.
 *
 * @apiParam {number} [limit=1] Limit the results.
 * @apiParam {number} [page=1] Paginate through results.
 * @apiParam {number} [skip] Number of records to skip.
 * @apiUse contains
 * @apiUse intersects
 * @apiUse rangeFields
 * @apiUse termFields
 * @apiUse search
 *
 * @apiUse landsatSuccess
 *
 * @apiError statusCode     The error code.
 * @apiError error          Error Name.
 * @apiError message        Error Message.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      "statusCode": 400,
 *      "error": "Bad Request",
 *      "message": "Incorrect coordinates: 38.9117833,^77.0298486. Only digits, dot, minus and comma are allowd."
 *     }
 */

 /**
 * @api {post} /landsat POST
 * @apiName postLandsatMeta
 * @apiGroup API
 * @apiVersion 1.0.0
 *
 * @apiDescription This is the only end-point of landsat-api. Through this end-point
 * you can search and query landsat meta data. It supports both `GET` and `POST` requests.
 *
 * All parameters and response is the same as the `GET` request.
 */
module.exports = [
  {
    method: ['GET', 'POST'],
    path: '/landsat',
    handler: function (request, reply) {
      // Determine whether to use MongoDB or ElasticSearch
      if (process.env.DB_TYPE === 'mongo') {
        landsat = mongo;
      } else {
        landsat = es;
      }

      var params = {};

      // For GET
      if (request.query) {
        params = request.query;
      }

      // For POST
      if (request.payload) {
        params = request.payload;

        // Crude hack for pagination lack of support for POST
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
