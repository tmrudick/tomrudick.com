module.exports = function(Handlebars) {
    Handlebars.registerHelper('email_api', function(data) {
        var result = [];

        data = data || { received: [], sent: [] };

        for (var i = 0; i < data.received.length; i++) {
            result.push({
                timestamp: data.received[i].x,
                received: data.received[i].y,
                sent: data.sent[i].y
            })
        }

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2) || ''
        );
    });

    Handlebars.registerHelper('inbox_api', function(data) {
        var result = [];

        data = data || { counts: [] };

        for (var i = 0; i < data.counts.length; i++) {
            result.push({
                timestamp: data.counts[i].x,
                emails: data.counts[i].y
            });
        }

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2) || ''
        );
    });

    Handlebars.registerHelper('distance_api', function(data) {
        var result = [];

        data = data || [];

        data.forEach(function(value) {
            result.push({
                timestamp: value.x,
                distance: value.y
            })
        });

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2) || ''
        );
    });

    Handlebars.registerHelper('weight_api', function(data) {
        var result = [];

        data = data || [];

        data.forEach(function(value) {
            result.push({
                timestamp: value.x,
                weight: value.y
            })
        });

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2) || ''
        );
    });

    Handlebars.registerHelper('bmi_api', function(data) {
        var result = [];

        data = data || [];

        data.forEach(function(value) {
            result.push({
                timestamp: value.x,
                bmi: value.bmi
            })
        });

        return new Handlebars.SafeString(
            JSON.stringify(result, null, 2) || ''
        );
    });

    Handlebars.registerHelper('checkins_api', function(data) {
        var checkins = [];

        data = data || [];

        data.forEach(function(checkin) {
            checkins.push({
                name: checkin.name,
                location: checkin.location,
                timestamp: checkin.timestamp,
                url: checkin.url
            });
        })

        return new Handlebars.SafeString(
            JSON.stringify(checkins, null, 2) || ''
        );
    });

    Handlebars.registerHelper('music_api', function(monthly, daily) {
        var result = [];

        monthly = monthly || [];
        daily = daily || {};

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
            JSON.stringify(result, null, 2) || ''
        );
    });

    Handlebars.registerHelper('link', function(text, url) {
        return new Handlebars.SafeString(
            "<a href='" + url + "'>" + text + "</a>"
        );
    });

    Handlebars.registerHelper('json', function(object) {
        return new Handlebars.SafeString(JSON.stringify(object) || '');
    });

    Handlebars.registerHelper('pretty_json', function(object) {
        return new Handlebars.SafeString(JSON.stringify(object, null, 2) || '');
    });
};