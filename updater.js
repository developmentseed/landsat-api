'use strict';
var Updater = require('landsat-meta-updater');

var u = new Updater('landsat', '8', 500);

// Update Elastic Search
u.updateEs(function (err, msg) {
  if (err) {
    console.log('Error:', err);
  }
  console.log(msg);
});
