'use strict';

var ejs = require('elastic.js');
var client = require('../services/elasticsearch.js');

module.exports = function (params, request, cb) {

  var err;

  var SUPPORTED_QUERY_RE = '^[0-9a-zA-Z#\*\.\_\:\(\)\"\\[\\]\{\}\\-\\+\>\<\= ]+$';
  var supported_query_re = new RegExp(SUPPORTED_QUERY_RE);

  // Build Elastic Search Query
  var q = ejs.Request();

  if (!params.search) {
    q.query(ejs.MatchAllQuery());
  }

  var from = (request.page - 1) * request.limit;

  if (params.search) {
    if (!supported_query_re.test(params.search)) {
      err = new Error({
        name: 'ElasticsearchQueryError',
        message: 'Search not supported: ' + params.search
      });
      request.log(['error'], err);
      return cb(err);
    }
    q.query(ejs.QueryStringQuery(params.search));
  }

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
        return cb(err, {}, 0);
      }

      var responseJson = [];
      for (var i = 0; i < body.hits.hits.length; i++) {
        var es_results = body.hits.hits[i]._source;
        responseJson.push(es_results);
      }

      return cb(err, responseJson, found.count);
    }, function(err) {
        request.log(['error'], err);
        return cb(err);
    });
  }, function(err) {
    request.log(['error'], err);
    return cb(err);
  });
};
