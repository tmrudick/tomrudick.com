#!/usr/bin/env node

var tonic = require('tonic'),
  hbs = require('tonic-hbs'),
  http = require('http'),
  finalhandler = require('finalhandler'),
  serveStatic = require('serve-static');

// Create and start tonic app
var app = tonic({ cache: process.env.DATA_PATH, config: process.env.CONFIG_PATH });
app.use(hbs);
app.jobs('jobs');
app.start();

// Create and start web server for api and public domains
var api = serveStatic('api'),
  serve = serveStatic('public');

var server = http.createServer(function(req, res){
  var done = finalhandler(req, res)
  if (req.headers.host && req.headers.host.indexOf('api.tomrudick.com') == 0) {
    api(req, res, done);
  } else {
    serve(req, res, done);
  }
});

// Listen
server.listen(8080);