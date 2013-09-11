var request = require('request'),
    moment = require('moment'),
    tumblr_api_key = require('../config.json').tokens.tumblr.api_key;

/*
 * Gets my last 7 8:36pm photos from Tumblr.
 * The last (most recent) photo uploaded will be
 * displayed as a large image where the later images
 * will be scaled to be much smaller.
 * This job will run every day at 9 and 10pm.
 */
job('eight30six', function(done) {
    var self = this;
    // Build the URL
    var url = 'http://api.tumblr.com/v2/blog/eight30six.tumblr.com/posts?api_key=' + tumblr_api_key + '&limit=7&filter=text';

    request.get({ url: url, json: true }, function(err, response, body) {
        if (err || !body.response.posts) {
            return done(self.data);
        }

        var PORTRAIT_WIDTH = 422;

        var posts = {
            recent: {},
            previous: []
        }

        // Pick out the newest (largest img) which will be first
        var newest_post = body.response.posts.shift();
        // The second alternate size is the one we want to display.
        posts.recent.img = newest_post.photos[0].alt_sizes[1].url;
        posts.recent.url = newest_post.post_url;
        posts.recent.caption = newest_post.caption;

        // If the width is equal to the portrait width, mark it with the
        // portrait-large css class. If it doesn't mark it as landscape.
        if (newest_post.photos[0].alt_sizes[1].width === PORTRAIT_WIDTH) {
            posts.recent.css = 'portrait-large';
        } else {
            posts.recent.css = 'landscape-large';
        }

        // Get the rest
        body.response.posts.forEach(function(post) {
            var photo = {};

            photo.img = post.photos[0].alt_sizes[1].url;
            photo.url = post.post_url;
            photo.caption = post.caption;

            if (post.photos[0].alt_sizes[1].width === 422) {
                photo.css = 'portrait-small';
            } else {
                photo.css = 'landscape-small';
            }

            posts.previous.push(photo);
        });

        done(posts);
    });
}).at('0 1,2 * * *');