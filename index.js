'use strict';

require('envloader').load();
var Server = require('./app/services/server.js');

var server = new Server(process.env.PORT || 4000);
server.start();
