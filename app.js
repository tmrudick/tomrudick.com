#!/usr/bin/env node

var tonic = require('tonic'),
  hbs = require('tonic-hbs'),
  http = require('http'),
  finalhandler = require('finalhandler'),
  serveStatic = require('serve-static'),
  google = require('googleapis');

// Load the config early to get the key info
var config = require(process.env.CONFIG_PATH || './config.json');

// Set up GoogleApi auth
var google_keys = config.tokens.google;
var oauth2Client = new google.auth.OAuth2(
  google_keys.client_id,
  google_keys.client_secret,
  google_keys.redirect_url);
oauth2Client.setCredentials(google_keys.tokens);
google.options({ auth: oauth2Client });

// Create and start tonic app
var app = tonic({ 
  cache: process.env.DATA_PATH || 'data.json', 
  config: process.env.CONFIG_PATH || 'config.json'
});
app.use(hbs);
app.jobs('jobs');
app.start();

// Create and start web server for api and public domains
var serve = serveStatic('public');

var server = http.createServer(function(req, res){
  var done = finalhandler(req, res)
  if (req.url === '/status') {
    res.end('OK');
  } else {
    serve(req, res, done);
  }
});

// Listen
server.listen(8080);
console.log("Server up and running!");
