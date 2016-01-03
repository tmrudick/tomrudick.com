var request = require('request'),
    moment = require('moment'),
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
    var categories = {}
    request({url: url, json: true}, function(err, res, body) {
        if (err || !body || !body.response || !body.response.checkins || !body.response.checkins.items) {
            return done(self.data);
        }

        // For each checkin, add it to the locations array
        body.response.checkins.items.forEach(function(location) {
            location.venue.categories.forEach(function(category) {
                if (!categories[category.pluralName]) {
                    categories[category.pluralName] = 0
                }

                categories[category.pluralName]++
            });

            locations.push({
                name: location.venue.name,
                location: location.venue.location,
                timestamp: location.createdAt * 1000,
                friendly_timestamp: moment(location.createdAt * 1000).fromNow(),
                url: location.venue.url || location.venue.canonicalUrl
            })
        });

        var c_keys = Object.keys(categories);
        var top_category = null
        var highest = 0;
        c_keys.forEach(function(key) {
            if (categories[key] > highest) {
                highest = categories[key];
                top_category = key.toLowerCase();
            }
        });

        done({
            recent: locations,
            top_category: top_category
        });
    });
}).every('30min');