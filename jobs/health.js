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
job('programming_age', function(done) {
    // Get today without any time portion
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get my birthday + 10 years
    var started_programming = new Date(1996, 9, 21);

    // Calculate the number of years out to two decimals
    var diff = today.getTime() - started_programming.getTime();
    var years = Math.floor(diff / 10 / 60 / 60 / 24 / 365) / 100;

    done(years);
}).at('0 4 * * *');

/**
 * Return a single object for how much I am walking today.
 * Runs often and gets data for the last 30 days.
 **/
job('walking', function(done) {
    var today = moment.utc().subtract(4, 'hours'),
        self = this;

    today = today.format('YYYY-MM-DD');

    request.get('http://api.fitbit.com/1/user/-/activities/distance/date/' + today + '/1m.json', fitbit_keys.token, fitbit_keys.token_secret, function(err, res) {
        if (err || !res) {
            return done(self.data);
        }
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
}).every('20min');

job('weight', function(done) {
    var today = moment.utc().subtract(4, 'hours');
    today = today.format('YYYY-MM-DD');

    request.get('http://api.fitbit.com/1/user/-/body/log/weight/date/' + today + '/1m.json', fitbit_keys.token, fitbit_keys.token_secret, function(err, res) {
        var response = JSON.parse(res);

        var result = {
            today: 0,
            monthly: []
        }

        response.weight.forEach(function(weight) {
            result.monthly.push({
                x: new Date(weight.date).getTime(),
                bmi: weight.bmi,
                y: weight.weight
            });
        });

        done(result);
    });
}).every('1 day').disable();

job('sleep', function(done) {
    var today = moment.utc().subtract(4, 'hours');
    today = today.format('YYYY-MM-DD');

    request.get('http://api.fitbit.com/1/user/-/sleep/minutesAsleep/date/' + today + '/1m.json', fitbit_keys.token, fitbit_keys.token_secret, function(err, res) {
        var response = JSON.parse(res);

        console.log(response);
        return done();
        var result = {
            today: 0,
            monthly: []
        }

        response.weight.forEach(function(weight) {
            result.monthly.push({
                x: new Date(weight.date).getTime(),
                bmi: weight.bmi,
                y: weight.weight
            });
        });

        done(result);
    });
}).every('1 day').disable();

job('falling_asleep', function(done) {
    var today = moment.utc().subtract(4, 'hours');
    today = today.format('YYYY-MM-DD');

    request.get('http://api.fitbit.com/1/user/-/sleep/minutesToFallAsleep/date/' + today + '/1m.json', fitbit_keys.token, fitbit_keys.token_secret, function(err, res) {
        var response = JSON.parse(res);

        console.log(response);
        return done();
        var result = {
            today: 0,
            monthly: []
        }

        response.weight.forEach(function(weight) {
            result.monthly.push({
                x: new Date(weight.date).getTime(),
                bmi: weight.bmi,
                y: weight.weight
            });
        });

        done(result);
    });
}).every('1 day').disable();