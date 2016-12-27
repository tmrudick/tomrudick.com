var request = require('request'),
    rp = require('request-promise');

job('sent_emails', function(done) {
    var self = this;
    var url = 'https://docs.google.com/spreadsheets/d/13eTU8XpF_vxHtH-KeozCYdpOmOH6Diwol5auxma231M/pub?gid=1317008117&single=true&output=csv';

    rp(url)
    .then(function(response) {
        csv = response.split('\n').splice(1);

        var data = {
            today: 0,
            week: 0,
            year: 0
        };

        csv.forEach(function(row, index) {
            values = row.split(',').splice(2);

            if (index == 0) {
                data.today = +values;
            } else if (index == 1) {
                data.week = +values;
            } else if (index == 2) {
                data.year = +values;
            }
        });

        return data;
    })
    .then(done, function(err) {
        console.log('Could not fetch gmail stats: ' + err);
        done(self.data);
    });
}).every('20m');
