var request = require('request');

job('gmail_traffic', '20m', function(done) {
    var url = 'https://docs.google.com/spreadsheet/pub?key=0AuxhddH4pqmRdDR2WUhJMGluY0J3bW9zWHNOR1VWLXc&single=true&gid=0&range=A1%3AC15&output=csv';

    request.get(url, function(err, res) {
        var csv = res.body;
        csv = csv.split('\n');

        var received = [];
        var sent = [];

        csv.forEach(function(row, index) {
            if (index === 0) { return; }

            var values = row.split(',');
            var timestamp = +values[0];
            received.unshift({
                x: timestamp,
                y: +values[1]
            });

            sent.unshift({
                x: timestamp,
                y: +values[2]
            });
        });

        done({
            received: received,
            sent: sent
        });
    });
});