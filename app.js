#!/usr/bin/env node

var Tonic = require('tonic');

var tonic = new Tonic({ cache: 'data.json', config: 'config.json' });

tonic.module('tonic-hbs').jobs('jobs');

tonic.start();