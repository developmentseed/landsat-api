'use strict';

var elasticsearch = require('elasticsearch');

module.exports = new elasticsearch.Client({
  host: process.env.ES_HOST || 'localhost:9200',

  // Note that this doesn't abort the query.
  requestTimeout: 10000  // milliseconds
});
