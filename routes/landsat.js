'use strict';

var Boom = require('boom');
var landsat = require('../controllers/landsat.js');

module.exports = [
  {
    method: ['GET', 'POST'],
    path: '/landsat',
    handler: function (request, reply) {
      var params = {};

      if (request.query) {
        params = request.query;
      }

      landsat(params, request, function (err, records, count) {
        if (err) {
          request.log(err);
          return reply(Boom.warp(err, 400));
        }

        request.count = count;
        return reply(records);
      });

    }
  }
];
