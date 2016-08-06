var moment = require('moment'),
    fitbit_keys = config().tokens.fitbit,
    request = require('request');

// Gets health/bio related data about me

/**
 * Return a single object for how much I am walking today.
 * Runs often and gets data for the last 30 days.
 **/
job('walking', function(done) {
    var today = moment.utc().subtract(5, 'hours'),
        self = this;

    today = today.format('YYYY-MM-DD');

    var options = {
        url: 'https://api.fitbit.com/1/user/-/activities/distance/date/' + today + '/1m.json',
        headers: {
            'Authorization': 'Bearer ' + fitbit_keys.access_token
        },
        json: true
    }

    request.get(options, function(err, res) {
        if (err || !res) {
            return done(self.data);
        }

        response = res.body;

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
    var today = moment.utc().subtract(5, 'hours');
    today = today.format('YYYY-MM-DD');

    var options = {
        url: 'https://api.fitbit.com/1/user/-/body/log/weight/date/' + today + '/1m.json',
        headers: {
            'Authorization': 'Bearer ' + fitbit_keys.access_token
        },
        json: true
    }

    request.get(options, function(err, res) {
        response = res.body;

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
}).every('1 day');

job('sleep', function(done) {
    var today = moment.utc().subtract(5, 'hours');
    today = today.format('YYYY-MM-DD');

    var options = {
        url: 'https://api.fitbit.com/1/user/-/sleep/minutesAsleep/date/' + today + '/1m.json',
        headers: {
            'Authorization': 'Bearer ' + fitbit_keys.access_token
        }
    }

    request.get(options, function(err, res) {
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
    var today = moment.utc().subtract(5, 'hours');
    today = today.format('YYYY-MM-DD');

    var options = {
        url: 'https://api.fitbit.com/1/user/-/sleep/minutesToFallAsleep/date/' + today + '/1m.json',
        headers: {
            'Authorization': 'Bearer ' + fitbit_keys.access_token
        }
    }

    request.get(options, function(err, res) {
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