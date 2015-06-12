'use strict';

var ejs = require('elastic.js');
var client = require('../services/elasticsearch.js');
var Boom = require('boom');

var legacyParams = function (params, q, limit) {
  var err;
  var supported_query_re = new RegExp('^[0-9a-zA-Z#\*\.\_\:\(\)\"\\[\\]\{\}\\-\\+\>\<\= ]+$');

  if (params.search) {
    if (!supported_query_re.test(params.search)) {
      err = Boom.create(400, 'Search not supported: ' + params.search, { timestamp: Date.now() });
      throw err;
    }

    q.query(ejs.QueryStringQuery(params.search));
  } else if (params.count) {
    q.facet(ejs.TermsFacet('count').fields([params.count]).size(limit));
  }

  return q;
};

module.exports = function (params, request, cb) {
  var err;

  // Build Elastic Search Query
  var q = ejs.Request();

  if (Object.keys(params).length === 0) {
    q.query(ejs.MatchAllQuery()).sort('acquisitionDate', 'desc');
  }

  // Do legacy search
  if (params.search || params.count) {
    q = legacyParams(params, q, request.limit);
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
      if (body.facets.count.terms.length !== 0) {
        response = body.facets.count.terms;
        count = body.facets.count.total;
      } else {
        return cb(Boom.notFound('Nothing to count!'));
      }

    // Process search
    } else {
      if (body.hits.hits.length === 0) {
        return cb(Boom.notFound('No matches found!'));
      }
      count = body.hits.total;

      for (var i = 0; i < body.hits.hits.length; i++) {
        response.push(body.hits.hits[i]._source);
      }
    }

    return cb(err, response, count);
  }, function (err) {
    return cb(Boom.badRequest(err));
  });
};
