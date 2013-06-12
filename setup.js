// Setup some extra handle bars templates to use for api.tomrudick.com

module.exports = function(Handlebars) {

    Handlebars.registerHelper('email_api', function(data) {
        var result = [];

        for (var i = 0; i < data.received.length; i++) {
            result.push({
                timestamp: data.received[i].x,
                received: data.received[i].y,
                sent: data.sent[i].y
            })
        }

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2)
        );
    });

    Handlebars.registerHelper('inbox_api', function(data) {
        var result = [];

        for (var i = 0; i < data.counts.length; i++) {
            result.push({
                timestamp: data[i].x,
                emails: data[i].y,
            })
        }

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2)
        );
    });

    Handlebars.registerHelper('distance_api', function(data) {
        var result = [];

        data.forEach(function(value) {
            result.push({
                timestamp: value.x,
                distance: value.y
            })
        });

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2)
        );
    });

    Handlebars.registerHelper('checkins_api', function(data) {
        data.forEach(function(value) {
            delete value.friendly_timestamp;
        })

        return new Handlebars.SafeString(
            JSON.stringify(data, null, 2)
        );
    });
}

