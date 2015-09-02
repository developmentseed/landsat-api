'use strict';

var _ = require('lodash');
var Boom = require('boom');
var esList = require('../controllers/es/landsat.js');
var esCount = require('../controllers/es/count.js');
var mongoList = require('../controllers/mongo/landsat.js');
var mongoCount = require('../controllers/mongo/count.js');
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
        landsat = mongoList;
      } else {
        landsat = esList;
      }

      var params = prepareRequest(request);

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
  },

  {
    method: ['GET', 'POST'],
    path: '/count',
    handler: function (request, reply) {
      // Determine whether to use MongoDB or ElasticSearch
      if (process.env.DB_TYPE === 'mongo') {
        landsat = mongoCount;
      } else {
        landsat = esCount;
      }

      var params = prepareRequest(request);

      // Send for processing
      landsat(params, request, function (err, count) {
        if (err) {
          request.log(err);
          return reply(err);
        }

        return reply({"count": count});
        //     {
        //       "name": "landsat-api",
        //       "license": "CC0-1.0",
        //       "website": "https://api.developmentseed.org/landsat",
        //       "found": count
        //     }
        // });
      });
    }
  },

];

var prepareRequest = function (request) {
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

  return params
};
