'use strict';

var Model = require('../../models/landsat.js');
var queries = require('./queries.js');

module.exports = function (params, request, cb) {
  // The query object
  var q = {};
  var fields = null;

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

  // Summary fields
  if (params.summary === true) {
    fields = {
      sceneID: 1,
      row: 1,
      path: 1,
      cloudCoverFull: 1,
      sceneStartTime: 1,
      sceneStopTime: 1,
      acquisitionDate: 1,
      browseURL: 1,
      browseAvailable: 1,
      sunAzimuth: 1,
      upperLeftCornerLatitude: 1,
      upperLeftCornerLongitude: 1,
      upperRightCornerLatitude: 1,
      upperRightCornerLongitude: 1,
      lowerLeftCornerLatitude: 1,
      lowerLeftCornerLongitude: 1,
      lowerRightCornerLatitude: 1,
      lowerRightCornerLongitude: 1,
      sceneCenterLatitude: 1,
      sceneCenterLongitude: 1,
      cloudCover: 1,
      boundingBox: 1
    }
  }

  var db = request.server.plugins['hapi-mongodb'].db;
  var collection = db.collection('landsats');
  var query = collection.find(q, {skip: skip, fields: fields, hint: {"boundingBox": "2dsphere"}});
  query.toArray(function (err, records) {
    if (err) return cb(err);
    query.count(function (err, count){
      cb(err, records, count);
    });
  });
};
