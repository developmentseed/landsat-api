'use strict';

var Hapi = require('hapi');
var boolifyString = require('boolify-string');
var landsat = require('../controllers/es/landsat.js');
var count = require('../controllers/es/count.js');
var customGenerateKey = require('../libs/shared.js').customGenerateKey;

var Server = function (port) {
  this.port = port;
  this.hapi = null;
};

Server.prototype.start = function (cb) {
  var self = this;

  var hapiOptions = {
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
  };

  var methodCacheOptions = {
    expiresAt: '00:00',
    generateTimeout: 10000
  };

  // Whether to use REDIS as cache
  if (boolifyString(process.env.REDIS_USE)) {
    hapiOptions.cache = [
      {
        engine: require('catbox-redis'),
        partition: 'cache',
        host: process.env.REDIS_HOST || '127.0.0.1',
        password: process.env.REDIS_PASSWORD || '',
        database: process.env.REDIS_DATABASE || '',
        port: process.env.REDIS_PORT || '6379'
      }
    ];
  }

  // Initial Hapi
  self.hapi = new Hapi.Server(hapiOptions);

  // Specify the port to use
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

  // Register Mongo Connnector if the system uses MongoDb
  if (process.env.DB_TYPE === 'mongo') {
    // Switch controllers to mongo
    landsat = require('../controllers/mongo/landsat.js');
    count = require('../controllers/mongo/count.js');

    // Register mongo-db connector
    self.hapi.register({
      register: require('hapi-mongodb'),
      options: {
        'url': process.env.MONGODB_URL || 'mongodb://localhost/landsat-api',
        'settings': {
            'db': {}
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

  // Good logger options
  var options = {
    opsInterval: 1000,
    reporters: [{
      reporter: require('good-console'),
      events: { log: '*', response: '*', request: '*', error: '*' }
    }]
  };

  // Register Monitoring/Logger plugin
  self.hapi.register({
    register: require('good'),
    options: options
  }, function (err) {
    if (err) throw err;
  });

  // Register Landsat method
  self.hapi.method('landsat', landsat, {
    cache: methodCacheOptions,
    generateKey: customGenerateKey
  });

  // Register Landsat method
  self.hapi.method('count', count, {
    cache: methodCacheOptions,
    generateKey: customGenerateKey
  });

  // Start Hapi Server
  self.hapi.start(function () {
    self.hapi.log(['info'], 'Server running at:' + self.hapi.info.uri);
    if (cb) {
      cb();
    }
  });
};

module.exports = Server;
