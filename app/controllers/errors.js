'use strict';

var Boom = require('boom');

var err;

module.exports.invalidGeoJsonError = function () {
  err = Boom.create(
    400,
    'Invalid geojson provided.',
    { timestamp: Date.now() }
  );
  throw err;
}

module.exports.incorrectCoordinatesError = function (data) {
  err = Boom.create(
    400,
    'Incorrect coordinates: ' + data + '. Only digits, dot, minus and comma are allowd.',
    { timestamp: Date.now() }
  );
  throw err;
}

module.exports.searchNotSupportedError = function (data) {
  err = Boom.create(400, 'Search not supported: ' + data, { timestamp: Date.now() });
  throw err;
}

