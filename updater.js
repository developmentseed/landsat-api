'use strict';
require('envloader').load();
var Updater = require('landsat-meta-updater');
var mongoose = require('mongoose');

console.log(process.env.MONGODB_URL);

var dbUrl = process.env.MONGODB_URL || 'mongodb://localhost/landsat-api';
console.log(dbUrl);
mongoose.connect(dbUrl);
var db = mongoose.connection;

var u = new Updater('landsat', '8', 1000);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('connected');
  u.updateMongoDb(dbUrl, function (err, msg) {
    if (err) {
      console.log('Error:', err);
    }
    console.log(msg);
    process.exit();
  });
});
