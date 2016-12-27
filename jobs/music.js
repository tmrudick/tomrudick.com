// Anything and everything to do with music related stats
var request = require('request-promise'),
    moment = require('moment-timezone'),
    util = require('./util'),
    _ = require('lodash'),
    access_token = config().tokens.facebook.access_token,
    lastfm = config().tokens.lastfm;

job('album_covers', function(done) {
  var self = this;
  request({ 
    url: 'https://graph.facebook.com/v2.6/me/music.listens',
    qs: {
      access_token: access_token,
      fields: 'data{song{image}}',
      limit: '50',
    },
    json: true })
  .then(function(response) {
    var covers = [];

    for (var i = 0; i < response.data.length; i++) {
        covers.push({
            cover: response.data[i].data.song.image,
            id: response.data[i].data.song.id
        });
    }

    return covers;
  })
  .then(function(covers) {
    return _.transform(_.uniqBy(covers, 'cover').slice(0, 6), function(result, song) {
        result.push(song.id);
    }, []);
  })
  .then(_hydrate)
  .then(function(songs) {
    var covers = [];
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].image.length > 0 && songs[i].data.album.length > 0) {
        covers.push({
          image: songs[i].image[0].url,
          href: songs[i].data.album[0].url.url
        });
      }
    }

    return covers;
  })
  .then(function(covers) {
    return covers;
  })
  .then(done)
  .catch(function(err) {
    console.log('Unable to load covers: ' + err);
    self.data = self.data ? self.data : [];
    done(self.data);
  });
}).every('20min');

job('music', function(done) {
  var data = this.data || {};
  var missing = util.getMissingDates(data);

  // Always add today and yesterday for fetching data
  var today = moment().tz('America/New_York').startOf('day');
  missing.push(today.clone());
  missing.push(today.subtract(1, 'day'));

  util.fetchTimeSeries(_fetchMusic, missing)
    .then(function(response) {
      response.forEach(function(item) {
        data[item.date] = item.value;
      })

      done(data);
    });
}).every('10min');

job('music_daily', function(done, music_data) {
  var today = moment()
    .tz('America/New_York')
    .startOf('day')
    .format('YYYY-MM-DD');

  done(music_data[today]);
}).after('music');

job('music_weekly', function(done, music_data) {
  var today = moment()
    .tz('America/New_York')
    .startOf('day');

  var weekly = 0;

  for (var i = 0; i < 7; i++) {
    var date = today.format('YYYY-MM-DD');

    if (music_data[date]) {
      weekly += music_data[date];
    }
  
    today.subtract(1, 'day');
  }

  done(weekly);
}).after('music');

job('music_yearly', function(done, music_data) {
  var today = moment()
    .tz('America/New_York')
    .startOf('day');

  var yearly = 0;

  for (var i = 0; i < 365; i++) {
    var date = today.format('YYYY-MM-DD');

    if (music_data[date]) {
      yearly += music_data[date];
    }
  
    today.subtract(1, 'day');
  }

  done(yearly);
}).after('music');

function _fetchMusic(date) {
  return request({
    url: 'http://ws.audioscrobbler.com/2.0',
    qs: {
      method: 'user.getrecenttracks',
      user: lastfm.user,
      api_key: lastfm.key,
      format: 'json',
      from: date.unix(),
      to: date.clone().add(1, 'day').unix()
    },
    json: true
  }).then(function(response) {
    return response.recenttracks.track.length;
  });
}

function _hydrate(ids) {
  var payload = [];

  for (var i = 0; i < ids.length; i++) {
    payload.push({
      method: 'GET',
      relative_url: ids[i]
    });
  }

  return request({
    method: 'POST',
    url: 'https://graph.facebook.com',
    qs: {
        access_token: access_token
    },
    json: true,
    body: {
      batch: payload
    }
  }).then(function(response) {
    var parsed = [];
    for (var i = 0; i < response.length; i++) {
      parsed.push(JSON.parse(response[i].body));
    }

    return parsed;
  });
}
