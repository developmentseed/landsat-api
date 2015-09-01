'use strict';
require('envloader').load();
var Updater = require('landsat-meta-updater');
var MongoClient = require('mongodb').MongoClient;
var tmp = require('tmp');

var dbUrl = process.env.MONGODB_URL || 'mongodb://localhost/landsat-api';

MongoClient.connect(dbUrl, function (err, db) {
  if (err) return console.log(err);

  var tmpobj = tmp.dirSync();

  var u = new Updater('landsat', '8', 1000, tmpobj.name);

  console.log('connected');
  u.updateMongoDb(dbUrl, function (err, msg) {
    if (err) {
      console.log('Error:', err);
    }
    console.log(msg);
    tmpobj.removeCallback();
    process.exit();
  });
});
