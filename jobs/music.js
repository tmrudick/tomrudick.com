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
        music.today.timestamp = Math.floor(today.valueOf() / 1000);

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

/*
 * Gets the last 5 unique album covers for tracks that I have been listening to
 */
job('album_covers', '1hour', function(done) {
    var url = 'https://graph.facebook.com/me/music.listens?access_token=' + access_token;

    var cover_urls = {};

    var getTrackIds = function(url) {
        request.get({ url: url, json: true}, function(err, response) {
            var ids = []
            response.body.data.forEach(function(song) {
                ids.push(song.data.song.id);
            });

            var getNextUrl = function() {
                if (Object.keys(cover_urls).length === 5) {
                    var keys = Object.keys(cover_urls);
                    var covers = [];
                    for (var idx = 0; idx < keys.length; idx++) {
                        var key = keys[idx];
                        covers.push({
                            url: cover_urls[key],
                            image: key
                        });
                    }
                    done(covers);
                } else if (ids.length === 0 && Object.keys(cover_urls).length < 5) {
                    getTrackIds(response.body.paging.next);
                } else {
                    _lookupSongs([ids.shift()], function(songs) {
                        cover_urls[songs[0].image[0].url] = songs[0].url;
                        getNextUrl()
                    });
                }
            }

            getNextUrl();
        });
    };

    getTrackIds(url);

}).expiration(0);

/*
 * Gets stream count per day for the past 29 days
 */
job('music_monthly', '1 day', function(done, existing_data) {
    if (!existing_data) {
        existing_data = [];
    }

    var obj = _toObject(existing_data);

    var yesterday = moment().subtract('days', 1).format('YYYY-MM-DD');
    yesterday = moment(yesterday + ' -0400', 'YYYY-MM-DD Z')

    // If we have today's data and 30 days worth of data total, we don't have anything
    // to do. No additional data can be collected. So, just return what we already got.
    if (obj[Math.floor(yesterday.valueOf()/1000)] && Object.keys(obj).length === 29) {
        console.log("BAILING")
        return done(existing_data);
    }

    var callback = function(date) {
        if (Object.keys(obj).length < 30) {
            console.log(Object.keys(obj).length);
            _getSongsForDate(date, function(ids) {
                // Need to get epoch seconds
                obj[Math.floor(date.valueOf()/1000)] = ids.length;

                date.subtract('days', 1);
                callback(date);
            });
        } else {
            _requestCache = {}
            done(_toArray(obj));
        }
    };

    callback(yesterday);
}).expiration(29);

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
    _cachedRequest(url, function(err, response) {
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
        _cachedRequest(url + id, function(err, response) {
            songs.push(response.body);

            if (--pending === 0) {
                callback(songs);
            }
        });
    });
}

var _requestCache = {}
function _cachedRequest(url, callback) {
    if (_requestCache[url]) {
        return callback.apply(null, _requestCache[url]);
    }

    request.get({ url: url, json: true }, function(err, response) {
        if (!_requestCache[url]) {
            _requestCache[url] = [err, response];
        }

        callback(err, response);
    });
}