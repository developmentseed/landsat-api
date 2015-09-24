'use strict';

var ejs = require('elastic.js');
var client = require('../../services/elasticsearch.js');
var queries = require('./queries.js');
var Boom = require('boom');

module.exports = function (params, request, cb) {
  var err;

  // Build Elastic Search Query
  var q = ejs.Request();

  // Do legacy search
  if (Object.keys(params).length > 0) {
    q = queries(params, q, request.limit);
  } else {
    q.query(ejs.MatchAllQuery()).sort('acquisitionDate', 'desc');
  }

  // Legacy support for skip parameter
  if (params.skip) {
    request.page = Math.floor(parseInt(params.skip, 10) / request.limit);
  }

  // Decide from
  var from = (request.page - 1) * request.limit;

  var search_params = {
    index: process.env.ES_INDEX || 'landsat',
    body: q
  };

  if (!params.count) {
    search_params.from = from;
    search_params.size = request.limit;
  }

  client.search(search_params).then(function (body) {
    return cb(err, body.hits.total);
  }, function (err) {
    return cb(Boom.badRequest(err));
  });
};
