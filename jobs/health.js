var moment = require('moment'),
    fitbit_keys = require('../config.json').tokens.fitbit,
    OAuth = require('oauth').OAuth;

// Create shared oauth request object for fitbit
var request = new OAuth(null, null, fitbit_keys.key, fitbit_keys.secret, '1.0', null, 'HMAC-SHA1', null, { 'Accept-Language': 'en_US' });

// Gets health/bio related data about me

/* Returns how many years I have been programming. This is
 * just some simple math assuming that I started programming
 * when I was 10 years old.
 *
 * Only want this to run once a day since I don't care about
 * intra-day accuracy of this pretty useless metric.
 */
job('programming_age', '1 day', function(done) {
    // Get today without any time portion
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get my birthday + 10 years
    var started_programming = new Date(1996, 9, 21);

    // Calculate the number of years out to two decimals
    var diff = today.getTime() - started_programming.getTime();
    var years = Math.floor(diff / 10 / 60 / 60 / 24 / 365) / 100;

    done(years);
});

/**
 * Return a single object for how much I am walking today.
 * Runs often and gets data for the last 30 days.
 **/
job('walking', '20min', function(done) {
    var today = moment().format('YYYY-MM-DD');
    today = moment(today + ' -0400', 'YYYY-MM-DD Z')
    today = today.format('YYYY-MM-DD');

    request.get('http://api.fitbit.com/1/user/-/activities/distance/date/' + today + '/1m.json', fitbit_keys.token, fitbit_keys.token_secret, function(err, res) {
        var response = JSON.parse(res);

        var miles = {
            today: 0,
            monthly: []
        }
        response['activities-distance'].forEach(function(distance) {
            if (distance.dateTime === today) {
                miles.today = Math.floor(distance.value * 100) / 100;
            }

            miles.monthly.push({
                x: moment(distance.dateTime, 'YYYY-MM-DD').valueOf() / 1000,
                y: Math.floor(distance.value * 100) / 100
            });
        });

        done(miles);
    });
});