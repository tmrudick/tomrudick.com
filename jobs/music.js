// Anything and everything to do with music related stats
var request = require('request');
var moment = require('moment');
var access_token = require('../config.json').tokens.facebook.access_token;

/*
 * Gets recent music activity from Facebook.
 * Returns the total number of songs that I've listened to today
 * as well as the last 5 songs.
 */
job('music', '10 min', function(done, previous) {
    var today = moment().format('YYYY-MM-DD');
    today = moment(today + ' -0400', 'YYYY-MM-DD Z')

    var music = {
        today: {}
    };

    // Get a list of all of the song ids that I listened to today
    _getSongsForDate(today, function(ids) {
        // Store how many songs I listened to today
        music.today.total = ids.length;

        // If we haven't listened to any songs yet today,
        // just return the last few songs we found
        if (ids.length === 0) {
            //music.today.songs = previous.today.songs;
            done(music);
        }

        // Lookup the full track names, artists, and urls for
        // the first five ids.
        _lookupSongs(ids.slice(0, 5), function(songs) {
            music.today.songs = [];
            songs.forEach(function(song) {
                music.today.songs.push({
                    title: song.title,
                    artist: song.data.musician[0].name,
                    url: song.url,
                    image: song.image[0].url
                });
            });

            done(music);
        });
    });
});

job('music_monthly', '1 day', function(done, existing_data) {
    if (!existing_data) {
        existing_data = [];
    }

    var obj = _toObject(existing_data);

    var today = moment().format('YYYY-MM-DD');
    today = moment(today + ' -0400', 'YYYY-MM-DD Z')

    var callback = function(date) {
        if (Object.keys(obj).length < 5) {
            console.log(Object.keys(obj).length);
            _getSongsForDate(date, function(ids) {
                // Need to get epoch seconds
                obj[Math.floor(date.valueOf()/1000)] = ids.length;

                date.subtract('days', 1);
                callback(date);
            });
        } else {
            console.log('DONE');
            done(_toArray(obj));
        }
    };

    callback(today);
});

// Turns an array like [[date, value], [date, value]]
// into an object like { date: value, date: value }
function _toObject(array) {
    var obj = {}

    for (var i = 0; i < array.length; i++) {
        obj[array[i][0]] = array[i][1];
    }

    return obj
}

// Turns an object into an array like:
// [[property, value], [property, value]]
function _toArray(obj) {
    var array = [];

    var keys = Object.keys(obj)
    for (var idx = 0; idx < keys.length; idx++) {
        var key = keys[idx];

        array.push([+key, obj[key]]);
    }

    return array;
}

// Helper function to assist with getting songs even
// if they paginate onto separate pages (which they probably)
// almost always will.
function _getSongsForDate(date, url, callback) {
    // This is for the base case when we only call this function
    // with a date and a callback function.
    if (typeof url === 'function') {
        callback = url;
        url = 'https://graph.facebook.com/me/music.listens?access_token=' + access_token;
    }

    // All the songs we found so far
    var songs = [];

    // Fire off a request to the url
    request.get({ url: url, json: true }, function(err, response) {
        // Loop over all of the songs and push them into the array if they
        // were listened to after the passed in date.
        var finished = false;
        response.body.data.forEach(function(song) {
            var diff = new Date(song.start_time).getTime() - date.valueOf();
            if (diff > 0 && diff < 1000 * 60 * 60 * 24) {
                songs.push(song.data.song.id);
            } else if (diff < 0) {
                // Hit the end of today's songs, return false
                // to break out of the loop.
                finished = true;
            }
        });

        // If we still have songs to load, recursively call this function
        // with the next page of results.
        if (!finished) {
            _getSongsForDate(date, response.body.paging.next, function(paged) {
                callback(songs.concat(paged));
            });
        } else {
            // Completely done with all of the songs, so
            // just return the tracks that we already aggregated.
            callback(songs);
        }
    })
}

function _lookupSongs(ids, callback) {
    var url = 'http://graph.facebook.com/';
    var songs = [];

    var pending = ids.length;
    ids.forEach(function(id) {
        request.get({ url: url + id, json: true }, function(err, response) {
            songs.push(response.body);

            if (--pending === 0) {
                callback(songs);
            }
        });
    });
}