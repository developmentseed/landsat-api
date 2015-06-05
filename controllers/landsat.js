'use strict';

var ejs = require('elastic.js');
var client = require('../services/elasticsearch.js');
var Boom = require('boom');

module.exports = function (params, request, cb) {

  var err;
  var supported_query_re = new RegExp('^[0-9a-zA-Z#\*\.\_\:\(\)\"\\[\\]\{\}\\-\\+\>\<\= ]+$');

  // Build Elastic Search Query
  var q = ejs.Request();

  if (!params.search) {
    q.query(ejs.MatchAllQuery());
  }

  if (params.search) {
    if (!supported_query_re.test(params.search)) {
      err = Boom.create(400, 'Search not supported: ' + params.search, { timestamp: Date.now() });
      request.log(['error'], err);
      return cb(err);
    }
    q.query(ejs.QueryStringQuery(params.search));
  }

  //Legacy support for skip parameter
  if (params.skip) {
    request.page = Math.floor(parseInt(params.skip) / request.limit);
  }

  // Decide from
  var from = (request.page - 1) * request.limit;

  client.count({
    index: 'landsat',
    body: q
  }).then(function (found) {
    client.search({
      index: 'landsat',
      body: q,
      from: from,
      size: request.limit
    }).then(function (body) {

      if (body.hits.hits.length === 0) {
        return cb(Boom.notFound('No matches found!'));
      }

      var responseJson = [];
      for (var i = 0; i < body.hits.hits.length; i++) {
        var es_results = body.hits.hits[i]._source;
        responseJson.push(es_results);
      }

      return cb(err, responseJson, found.count);
    }, function(err) {
        request.log(['error'], err);
        return cb(Boom.badRequest(err));
    });
  }, function(err) {
    request.log(['error'], err);
    return cb(Boom.badRequest(err));
  });
};
