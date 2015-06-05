'use strict';

var _ = require('lodash');
var Boom = require('boom');
var landsat = require('../controllers/landsat.js');

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
