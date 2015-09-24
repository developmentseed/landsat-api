'use strict';

var queries = require('./queries.js');
var boolifyString = require('boolify-string');

module.exports = function (params, request, cb) {
  // The query object
  var q = {};
  var fields = null;

  // assemble the query
  if (Object.keys(params).length > 0) {
    q = queries(params, q, 1000);
  }

  var db = request.server.plugins['hapi-mongodb'].db;
  var collection = db.collection('landsats');
  collection.find(q).count(function (err, count){
    if (err) return cb(err);
    cb(err, count);
  });
};
