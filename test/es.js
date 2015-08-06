/* global describe, after, before */
'use strict';

var async = require('async');
var fs = require('fs');
var nock = require('nock');
var Updater = require('landsat-meta-updater');
var Server = require('../app/services/server.js');
var client = require('../app/services/elasticsearch.js');
var shared = require('./shared');

describe('Elasticsearch tests', function () {
  this.timeout(10000);
  var testIndex = 'test_main';
  var testType = '8';
  var downloadDir = __dirname + '/download';
  var self = this;
  var port = 2000;

  before(function (done) {
    process.env.ES_INDEX = testIndex;
    process.env.DB_TYPE = 'landsat';
    process.env.ES_HOST = 'localhost:9200';

    // Add records to elasticsearch
    var csv = fs.readFileSync(__dirname + '/test_data.csv', {encoding: 'utf8'});
    nock('http://landsat.usgs.gov')
      .get('/metadata_service/bulk_metadata_files/LANDSAT_8.csv')
      .reply(200, csv);

    var u = new Updater(testIndex, testType, null, downloadDir);

    async.waterfall([
      // Add records to ES
      function (callback) {
        u.updateEs(callback);
      },

      // Start server
      function (msg, callback) {
        self.server = new Server(port);
        self.server.start(callback);
      }
    ], function (err) {
      if (err) console.log(err);

      // Wait for 7000 ms
      setTimeout(function () {
        done();
      }, 4000);
    });
  });

  // Run tests
  shared(port);

  after(function (done) {
    client.indices.delete({index: testIndex}).then(function () {
      fs.unlinkSync(downloadDir + '/landsat.csv');
      fs.rmdirSync(downloadDir);
      self.server.hapi.stop(done);
    }).catch(function (err) {
      if (err) console.log(err);
    });
  });
});
