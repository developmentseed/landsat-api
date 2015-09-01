/* global before, after, describe */
'use strict';

var async = require('async');
var MongoClient = require('mongodb').MongoClient;

var moment = require('moment');
var Server = require('../app/services/server.js');
var data = require('./data.json');
var shared = require('./shared.js');

describe('MongoDb tests', function () {
  this.timeout(15000);
  var port = 6000;
  var self = this;

  before(function (done) {
    // Set env to force use of mongodb
    process.env.DB_TYPE = 'mongo';
    process.env.MONGODB_URL = 'mongodb://localhost/landsat-test';

    var db1;

    async.waterfall([
      function (callback) {
        MongoClient.connect(process.env.MONGODB_URL, callback);
      },
      function (db, callback) {
        db1 = db;
        db.createCollection('landsats', callback);
      },
      function (collection, callback) {
        async.eachSeries(data, function (item, callback) {
          item.acquisitionDate = moment(item.acquisitionDate).format();
          collection.insertOne(item, callback);
        }, callback);
      },
      function (callback) {
          db1.close(callback)
      }],
    function (err) {
      if (err) console.log(err);
      self.server = new Server(port);
      self.server.start(function (err) {
        if (err) console.log(err);
        setTimeout(function() {
          done();
        }, 1000);
      });
    });
  });

  // run shared tests
  shared(port);

  after(function (done) {
    MongoClient.connect(process.env.MONGODB_URL, function(err, db) {
      db.dropDatabase(function(err, result) {
        db.close();
        done();
      });
    });
  });
});
