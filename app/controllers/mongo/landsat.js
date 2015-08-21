'use strict';

var Model = require('../../models/landsat.js');
var queries = require('./queries.js');

module.exports = function (params, request, cb) {
  // The query object
  var q = {};

  // assemble the query
  if (Object.keys(params).length > 0) {
    q = queries(params, q, request.limit);
  }

  // Legacy support for skip parameter
  if (params.skip) {
    request.page = Math.floor(parseInt(params.skip, 10) / request.limit);
  }

  // Decide from
  var skip = request.limit * (request.page - 1);

  Model.count(q, function (err, count) {
    if (err) {
      return cb(err, null, null);
    }
    Model.find(q, null, {skip: skip, limit: request.limit}).exec(function (err, records) {
      cb(err, records, count);
    });
  });
};
