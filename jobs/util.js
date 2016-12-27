var moment = require('moment-timezone'),
  Promise = require('bluebird');

var DATE_LIMIT = '2017-01-01T05:00:00.000Z';

module.exports = {
  getMissingDates: function(values) {
    var now = moment(),
      current = moment(DATE_LIMIT),
      missing = [];

    while (current < now) {
      if (!values[current.format('YYYY-MM-DD')]) {
        missing.push(current.clone());
      }
      current.add(1, 'day');
    }

    return missing;  
  },
  fetchTimeSeries: function(fn, dates) {
    var promises = [];

    dates.forEach(function(date) {
      promises.push(
        fn(date)
        .then(function(result) {
          return {
            date: date.format('YYYY-MM-DD'),
            value: result
          };
        })
        .catch(function(err) { 
          console.log('Unable to fetch data: ' + err);
          return null; 
        }));
    });

    return Promise.all(promises)
      .filter(function(result) {
        return result != null;
      });
  }
}