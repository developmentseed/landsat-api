var fs = require('fs');
var csv = require('csv');
var request = require('request');
var _ = require('lodash');
var client = require('./elasticsearch.js');

// Read the list of previously added scenes
try{
  var scenes = require('./_scenes.json');
} catch(err){
  if(err.code === 'MODULE_NOT_FOUND'){
    scenes = [];
  }
}

var ES_INDEX = 'landsat';
var ES_TYPE = '8';
var groupId = 0
var group = [];
// var bulk = [];
var bulkSize = 20000;
var skipped = 0;
var total = 0;
var added = 0;

var processRecords = function (scene, value) {
  client.exists({
    index: ES_INDEX,
    type: ES_TYPE,
    id: scene
  }, function (error, exists) {
    if (exists === true) {
      process.stdout.write('Log: added: ' + added + ' skipped: ' + skipped + ' total: ' + total + '\r');
      skipped++;
      total++;
      deleteScene(scene);
    } else {
      client.create({
        index: ES_INDEX,
        type: ES_TYPE,
        id: scene,
        body: value
      }, function (error, response) {
        if (error) {
          console.log(error);
          return;
        }
        added++;
        total++;
        process.stdout.write('Log: added: ' + added + ' skipped: ' + skipped + ' total: ' + total + '\r');
        deleteScene(scene);
      });
    }
  });
};

var deleteScene = function (scene) {
  delete group[scene];
  for (var key in group) {
    processRecords(key, group[key]);
    break;
  }
};

var addBulk = function (id) {
  client.bulk({
    body: group[id]
  }, function (err, resp) {
    if (err) {
      console.log(err);
    }

    added = added + group[id].length / 2;
    group[id] = [];
    id++;
    if (id <= groupId) {
      process.stdout.write('Log: processed: ' + total + ' added: ' + added + '\r');
      addBulk(id);
    }
  });
};

var landsatCsv = function () {
  var i = 0;
  var header;
  var bulk = [];
  var skipFields = ['dateUpdated', 'sceneStopTime', 'sceneStartTime', 'acquisitionDate'];

  var req = request.get('http://landsat.usgs.gov/metadata_service/bulk_metadata_files/LANDSAT_8.csv');

  req.on('error', function(err) {
      console.log(err);
      cb(err)
    })
    .pipe(csv.parse())
    .pipe(csv.transform(function(record){
        // Read the header
        if (i === 0) {
          header = record;
        } else {
          var output = {};

          if (_.indexOf(scenes, record[0]) === -1) {

            scenes.push(record[0]);

            for (var j = 0; j < header.length; j++) {
              //convert numbers to float
              var value = parseFloat(record[j]);
              if (_.isNaN(value) || skipFields.indexOf(header[j]) != -1 ) {
                value = record[j];
              }

              output[header[j]] = value;
            }

            if (bulk.length < bulkSize) {
              bulk.push({index: {_index: ES_INDEX, _type: ES_TYPE, _id: record[0]}});
              bulk.push(output);
              total++;
            } else {
              group[groupId] = bulk;
              bulk = [];

              if (groupId === 0) {
                addBulk(0);
              }
              groupId++;
            }
          } else {
            total++;
          }
        }

        i++;
      })
    )
    .on('close', function (err) {
        console.log('Download completed');
        cb(err, 'Download completed');
        var str = JSON.stringify(scenes);
        fs.write('._scenes', str);
    });
};

landsatCsv();
