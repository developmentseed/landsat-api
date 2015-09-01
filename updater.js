'use strict';
require('envloader').load();
var Updater = require('landsat-meta-updater');
var mongoose = require('mongoose');
var tmp = require('tmp');

var dbUrl = process.env.MONGODB_URL || 'mongodb://localhost/landsat-api';
mongoose.connect(dbUrl);
var db = mongoose.connection;

// Temp folder
var tmpobj = tmp.dirSync();

var u = new Updater('landsat', '8', 1000, tmpobj);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
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
