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
    var response = [];
    var count = 0;

    // Process Facets
    if (params.count) {
      // Term facet count
      response = body.facets.count.terms;
      count = body.facets.count.total;

    // Process search
    } else {
      count = body.hits.total;

      for (var i = 0; i < body.hits.hits.length; i++) {
        response.push(body.hits.hits[i]._source);
      }
    }

    var r = {
      meta: {
        found: count
      },
      results: response
    };

    // Stay valid for 24 hours in cache
    return cb(err, r, 86400000);
  }, function (err) {
    return cb(Boom.badRequest(err));
  });
};
