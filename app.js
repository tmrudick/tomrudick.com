#!/usr/bin/env node

var tonic = require('tonic'),
  hbs = require('tonic-hbs'),
  http = require('http'),
  finalhandler = require('finalhandler'),
  serveStatic = require('serve-static');

// Create and start tonic app
var app = tonic({ 
  cache: process.env.DATA_PATH || 'data.json', 
  config: process.env.CONFIG_PATH || 'config.json'
});
app.use(hbs);
app.jobs('jobs');
app.start();

// Create and start web server for api and public domains
var api = serveStatic('api'),
  serve = serveStatic('public');

var server = http.createServer(function(req, res){
  var done = finalhandler(req, res)
  if (req.headers.host && req.headers.host.indexOf('api.tomrudick.com') == 0) {
    req.url = rewriteApiUrl(req.url);
    api(req, res, done);
  } else if (req.url === '/status') {
    res.end('OK');
  } else {
    serve(req, res, done);
  }
});

// Rewrite /v1/inbox/traffic to /inbox_traffic.json
// so that it can be properly served from the api folder.
function rewriteApiUrl(url) {
  if (url.indexOf('/v1') === 0) {
    url = url.substring(4);
    url = url.replace('/', '_');
    url = '/' + url + '.json';
  }

  return url;
}

// Listen
server.listen(8080);
console.log("Server up and running!");
