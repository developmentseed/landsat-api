/* global before, after, describe */
'use strict';

var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var Landsat = require('../app/models/landsat.js');
var Server = require('../app/services/server.js');
var data = require('./data.json');
var shared = require('./shared.js');

describe('MongoDb tests', function () {
  this.timeout(15000);
  var port = 6000;
  var self = this;

  before(function (done) {
    // Set env to force use of mongodb
    process.env['DB_TYPE'] = 'mongo';
    process.env['MONGODB_URL'] = 'mongodb://localhost/landsat-test';

    self.server = new Server(port);
    self.server.start(function (err) {
      if (err) console.log(err);

      // Add records to mongodb
      async.eachSeries(data, function (item, callback) {
        item.acquisitionDate = moment(item.acquisitionDate).format();
        var record = new Landsat(item);
        record.save(callback);
      }, function (err) {
        if (err) console.log(err);
        done();
      });
    });
  });

  // run shared tests
  shared(port);

  after(function (done) {
    var db = mongoose.connection;

    // Drop the test database
    db.db.dropDatabase(function (err) {
      if (err) {
        console.log(err);
      }
      mongoose.connection.close();
      self.server.hapi.stop(done);
    });
  });
});
