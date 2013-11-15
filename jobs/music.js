// Anything and everything to do with music related stats
var request = require('request');
var moment = require('moment');
var access_token = require('../config.json').tokens.facebook.access_token;

moment.fn.timeless = function(offset) {
    offset = offset || 0;
    return this.clone().hours(offset).minutes(0).seconds(0).milliseconds(0);
}

/*
 * Gets recent music activity from Facebook.
 * Returns the total number of songs that I've listened to today
 * as well as the last 5 songs.
 */
job('music_daily', function(done, previous) {
    var self = this;
    // Get the current datetime at 5am UTC / 12am EDT
    var start_time = moment.utc().subtract(5, 'hours').timeless(5);

    // Get the end time 24 hours from the start
    var end_time = start_time.clone().add(24, 'hours');

    // Get a list of all of the ids that I listened to today
    _getSongIdsForDateRange(start_time, end_time, function(ids) {
        if (!ids) {
            return done(self.data);
        }
        var today = _tzOffset(-4);

        // Return the length of how many ids were returned
        done({ timestamp: today, total: ids[today] ? ids[today].length : 0 });
    });
}).every('10min');

/*
 * Gets the last 5 unique album covers for tracks that I have been listening to
 */
job('album_covers', function(done) {
    // Request 50 songs
    var self = this;
    var url = 'https://graph.facebook.com/me/music.listens?limit=50&access_token=' + access_token;

    // Create an object to hold image_url -> song_url mappings
    var cover_urls = {};

    // Make the request to facebook
    request.get({ url: url, json: true}, function(err, response) {
        if (err) {
            return done(self.data);
        }
        // Process next id will pop albums off of the response and then
        // check to see if we have a unique image url. If we do, then use it, if not
        // call ourselves again. I very highly doubt that we can't find 5 unique images
        // in 50 tracks.
        var processNextId = function() {
            if (Object.keys(cover_urls).length === 5 || response.body.data.length === 0) {
                var keys = Object.keys(cover_urls);
                var covers = [];

                keys.forEach(function(key) {
                    covers.push({
                        url: cover_urls[key],
                        image: key
                    });
                });

                done(covers);
            } else {
                _lookupSongs([response.body.data.shift().data.song.id], function(songs) {
                    cover_urls[songs[0].image[0].url] = songs[0].url;
                    processNextId();
                });
            }
        };

        processNextId();
    });
}).every('20min');

/*
 * Gets stream count per day for the past 29 days
 */
job('music_monthly', function(done) {
    var self = this;

    if (!this.data) {
        this.data = [];
    }

    var end_date = moment.utc().subtract(5, 'hours').timeless(5);
        start_date = end_date.clone().subtract(1, 'day');

    // If we have yesterday, don't do aanything
    var up_to_date = !this.data.every(function(data) {
        return data.x != start_date.valueOf() / 1000;
    });

    if (up_to_date) {
        return done(this.data);
    }

    // If we have less than 29 days of data, just regenerate everything.
    if (this.data.length < 29) {
        start_date = end_date.clone().subtract(29, 'days');
    }

    _getSongIdsForDateRange(start_date, end_date, function(days) {
        if (!days) {
            return done(self.data);
        }

        Object.keys(days).forEach(function(key) {
            self.data.push({
                x: +key,
                y: days[key].length
            });
        });

        done(self.data.slice(-30));
    });
}).at('0 4 * * *');

// Helper function to assist with getting songs even
// if they paginate onto separate pages (which they probably)
// almost always will.
function _getSongIdsForDateRange(start_date, end_date, url, callback) {
    // If the typeof url is a function, we were called without it,
    // and we need to push all of our parameters over by one.
    if (typeof url === 'function') {
        callback = url;
        url = 'https://graph.facebook.com/me/music.listens?limit=200&access_token=' + access_token;
    }

    // Create an object that will be date -> [id1, id2, id3]
    var songs = {};

    // Keep track of the last date we've seen to fill out the above object
    var last_seen_time = null;

    // Request some songs
    request.get({ url: url, json: true }, function(err, response) {
        if (err || !response.body.data) {
            return callback(null);
        }

        // Make a request to Facebook
        response.body.data.forEach(function(song) {
            var song_time = moment.utc(song.start_time).timeless(4);

            // If the time of this song falls between start/end add it to our object
            if (song_time.isSame(start_date) || (song_time.isAfter(start_date) && song_time.isBefore(end_date))) {
                // If the day has changed, create an empty list if it doesn't exist
                if (last_seen_time == null || !song_time.isSame(last_seen_time)) {
                    last_seen_time = last_seen_time || song_time.clone().add(1, 'day');

                    while (!song_time.isSame(last_seen_time)) {
                        if (song_time.isAfter(last_seen_time)) {
                            last_seen_time = song_time;
                        } else {
                            last_seen_time.subtract(1, 'day');
                        }

                        if (!songs[_tzOffset(-4, last_seen_time)]) {
                            songs[_tzOffset(-4, last_seen_time)] = [];
                        }
                    }
                }

                // Add this song to the object
                songs[_tzOffset(-4, song_time)].push(song.id);
            }
        });

        // If we are still within our range, call this method recursively with the next page
        if (last_seen_time && last_seen_time.isAfter(start_date)) {
            _getSongIdsForDateRange(start_date, end_date, response.body.paging.next, function(paged) {
                // Merge the keys from paged and songs and return
                songs = _mergeObjects(songs, paged);
                callback(songs);
            });
        } else {
            // We've received all of the songs from facebook in our date range, return
            callback(songs);
        }
    });
}

function _tzOffset(offset, date) {
    date = date || moment.utc();
    return Math.floor(date.clone().add(offset, 'hours').hours(Math.abs(offset)).minutes(0).seconds(0) / 1000);
}

/*
 * Takes two objects as parameters and returns
 * a new object with their properties combined
 */
function _mergeObjects(obj1, obj2) {
    var result = {}

    Object.keys(obj1).forEach(function(key) {
        result[key] = obj1[key];
        if (obj1[key]) {
            obj1[key] = obj1[key].concat(obj2[key]);
        } else {
            obj1[key] = obj2[key];
        }
    });

    Object.keys(obj2).forEach(function(key) {
        if (result[key]) {
            result[key] = result[key].concat(obj2[key]);
        } else {
            result[key] = obj2[key];
        }
    });

    return result;
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