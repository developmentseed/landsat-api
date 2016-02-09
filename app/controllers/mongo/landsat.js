'use strict';

var queries = require('./queries.js');
var boolifyString = require('boolify-string');

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


  fields = {};
  // Summary fields
  if (boolifyString(params.summary)) {
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
      sceneCenterLatitude: 1,
      sceneCenterLongitude: 1,
      upperLeftCornerLatitude: 1,
      upperLeftCornerLongitude: 1,
      upperRightCornerLatitude: 1,
      upperRightCornerLongitude: 1,
      lowerLeftCornerLatitude: 1,
      lowerLeftCornerLongitude: 1,
      lowerRightCornerLatitude: 1,
      lowerRightCornerLongitude: 1,
      cloudCover: 1,
      boundingBox: 1
    };
  }

  // exclude _id
  fields['_id'] = 0;

  var db = request.server.plugins['hapi-mongodb'].db;
  var collection = db.collection('landsats');
  var query = collection.find(q, {skip: skip, limit: request.limit, fields: fields}).sort({acquisitionDate: -1});
  query.toArray(function (err, records) {
    if (err) return cb(err);
    collection.find(q).count(function (err, count) {
      var r = {
        meta: {
          found: count
        },
        results: records
      };

      // Stay valid for 24 hours in cache
      cb(err, r, 86400000);
    });
  });
};
