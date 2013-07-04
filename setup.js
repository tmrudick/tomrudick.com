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
                timestamp: data.counts[i].x,
                emails: data.counts[i].y
            });
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

    Handlebars.registerHelper('weight_api', function(data) {
        var result = [];

        data.monthly.forEach(function(value) {
            result.push({
                timestamp: value.x,
                weight: value.y
            })
        });

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2)
        );
    });

    Handlebars.registerHelper('checkins_api', function(data) {
        var checkins = [];

        data.forEach(function(checkin) {
            results.push({
                name: checkin.name,
                location: checkin.location,
                timestamp: checkin.timestamp,
                url: checkin.url
            });
        })

        return new Handlebars.SafeString(
            JSON.stringify(checkins, null, 2)
        );
    });

    Handlebars.registerHelper('music_api', function(monthly, daily) {
        var result = [];

        monthly.forEach(function(value) {
            result.push({
                timestamp: value.x,
                songs: value.y
            });
        })

        result.push({
            timestamp: daily.timestamp,
            songs: daily.total
        });

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2)
        );
    });
}

