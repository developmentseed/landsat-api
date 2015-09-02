'use strict';

var Hapi = require('hapi');
var mongo = require('mongodb');

var Server = function (port) {
  this.port = port;
  this.hapi = null;
};

Server.prototype.start = function (cb) {
  var self = this;

  self.hapi = new Hapi.Server({
    connections: {
      routes: {
        cors: true
      },
      router: {
        stripTrailingSlash: true
      }
    },
    debug: process.env.OR_DEBUG ? {
      log: [ 'error' ],
      request: [ 'error', 'received', 'response' ]
    } : false
  });

  self.hapi.connection({ port: this.port });

  // Register hapi-router
  self.hapi.register({
    register: require('hapi-router'),
    options: {
      routes: './app/routes/*.js'
    }
  }, function (err) {
    if (err) throw err;
  });

  if (process.env.DB_TYPE === 'mongo') {
    // Register mongo-db connector
    self.hapi.register({
      register: require('hapi-mongodb'),
      options: {
        'url': process.env.MONGODB_URL || 'mongodb://localhost/landsat-api',
        'settings': {
            "db": {}
        }
      }
    }, function (err) {
      if (err) throw err;
    });
  }

  // Register hapi-response-meta
  self.hapi.register({
    register: require('hapi-response-meta'),
    options: {
      content: {
        name: 'landsat-api',
        license: 'CC0-1.0',
        website: process.env.RESPONSE_HEADER_SERVER || 'https://api.developmentseed.org/landsat'
      },
      routes: ['/landsat', '/count']
    }
  }, function (err) {
    if (err) throw err;
  });

  // Register hapi-paginate
  self.hapi.register({
    register: require('hapi-paginate'),
    options: {
      limit: 1,
      routes: ['/landsat']
    }
  }, function (err) {
    if (err) throw err;
  });

  // Register good logger
  var options = {
    opsInterval: 1000,
    reporters: [{
      reporter: require('good-console'),
      events: { log: '*', response: '*', request: '*', error: '*' }
    }]
  };

  self.hapi.register({
    register: require('good'),
    options: options
  }, function (err) {
    if (err) throw err;
  });

  self.hapi.start(function () {
    self.hapi.log(['info'], 'Server running at:' + self.hapi.info.uri);
    if (cb) {
      cb();
    }
  });
};

module.exports = Server;
