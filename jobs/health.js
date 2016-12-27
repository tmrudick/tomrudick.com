var moment = require('moment-timezone'),
    util = require('./util'),
    google = require('googleapis'),
    fitness = google.fitness('v1');

var WALKING_TYPE = 7;
var BIKING_TYPE = 1;

// Gets health/bio related data about me
job('fit', function(done) {
  var data = this.data || {};
  var missing = util.getMissingDates(data);

  // Always add today and yesterday for fetching data
  var today = moment().tz('America/New_York').startOf('day');
  missing.push(today.clone());

  // HACK: Remove this conditional later
  today.subtract(1, 'day');
  if (today.unix() != 1483160400) {
    missing.push(today);
  }

  util.fetchTimeSeries(_fetchDistance, missing).then(function(response) {
    response.forEach(function(item) {
      data[item.date] = item.value;
    })

    done(data);
  });

}).every('20min');

job('fitness_daily', function(done, fit_data) {
  var today = moment()
    .tz('America/New_York')
    .startOf('day')
    .format('YYYY-MM-DD');

  done(fit_data[today]);
}).after('fit');

job('fitness_weekly', function(done, fit_data) {
  var today = moment()
    .tz('America/New_York')
    .startOf('day');

  var weekly = {
    walking: 0,
    biking: 0
  };

  for (var i = 0; i < 7; i++) {
    var date = today.format('YYYY-MM-DD');

    if (fit_data[date]) {
      weekly.walking += fit_data[date].walking;
      weekly.biking += fit_data[date].biking;
    }
  
    today.subtract(1, 'day');
  }

  done(weekly);
}).after('fit');

job('fitness_yearly', function(done, fit_data) {
  var today = moment()
    .tz('America/New_York')
    .startOf('day');

  var yearly = {
    walking: 0,
    biking: 0
  };

  for (var i = 0; i < 365; i++) {
    var date = today.format('YYYY-MM-DD');

    if (fit_data[date]) {
      yearly.walking += fit_data[date].walking;
      yearly.biking += fit_data[date].biking;
    }
  
    today.subtract(1, 'day');
  }

  done(yearly);
}).after('fit');

function _fetchDistance(date) {
  return new Promise(function(resolve, reject) {
    fitness.users.dataset.aggregate({
      userId: 'me',
      resource: {
        aggregateBy: [
          {
            dataTypeName: 'com.google.distance.delta'
          }
        ],
        startTimeMillis: '' + date.valueOf(),
        endTimeMillis: '' + date.clone().add(1, 'day').valueOf(),
        bucketByActivityType: {}
      }
    }, {}, function(err, response) {
      if (err) {
        return reject(err);
      }

      var distance = {
        walking: 0,
        biking: 0
      };

      response.bucket.forEach(function(bucket) {
        var activity = bucket.activity;
        bucket.dataset.forEach(function(dataset) {
          dataset.point.forEach(function(point) {
            point.value.forEach(function(value) {
              if (bucket.activity == WALKING_TYPE) {
                distance.walking += value.fpVal;
              } else if (bucket.activity == BIKING_TYPE) {
                distance.biking += value.fpVal;
              }
            })
          })
        })
      });

      resolve(distance);
    });
  });
}
