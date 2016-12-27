var request = require('request'),
    moment = require('moment'),
    _ = require('lodash'),
    foursquare_auth_token = config().tokens.foursquare.auth_token;

/**
 * Checkins within the last rolling 7 days from foursquare.
 */
job('checkins', function(done) {
    // Get a date object from seven days ago (to cover a rolling week)
    var today = new Date(),
        self = this;
    today.setDate(today.getDate() - 7);
    var seven_days_ago = Math.floor(today.getTime() / 1000);

    // Build the URL based on our auth token and our timestamp
    var url = 'https://api.foursquare.com/v2/users/self/checkins?&v=20130204&oauth_token=' + foursquare_auth_token + '&afterTimestamp=' + seven_days_ago;

    var locations = [];
    var categories = {
        names: [],
        lookup: {}
    }
    request({url: url, json: true}, function(err, res, body) {
        if (err || !body || !body.response || !body.response.checkins || !body.response.checkins.items) {
            return done(self.data);
        }

        // For each checkin, add it to the locations array
        body.response.checkins.items.forEach(function(location) {
            location.venue.categories.forEach(function(category) {
                categories.names.push(category.name);
                categories.lookup[category.name] = category;
            });

            locations.push({
                name: location.venue.name,
                location: location.venue.location,
                timestamp: location.createdAt * 1000,
                friendly_timestamp: moment(location.createdAt * 1000).fromNow(),
                url: location.venue.url || location.venue.canonicalUrl
            })
        });

        flatCategories = _.chain(categories.names)
        .countBy()
        .map(function(count, category) {
            category = categories.lookup[category];
            return {
                name: count == 1 ? category.name : category.pluralName,
                count: count
            };
        }).sortBy('count').reverse().value().slice(0, 8);

        done({
            recent: locations,
            categories: flatCategories
        });
    });
}).every('30min');