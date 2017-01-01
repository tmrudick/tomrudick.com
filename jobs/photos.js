var request = require('request'),
    moment = require('moment'),
    tumblr_api_key = config().tokens.tumblr.api_key;

/*
 * Gets my last 7 8:36pm photos from Tumblr.
 * This job will run every day at 9 and 10pm.
 */
job('eight30six', function(done) {
    var self = this;
    // Build the URL
    var url = 'https://api.tumblr.com/v2/blog/eight30six.tumblr.com/posts?api_key=' + tumblr_api_key + '&limit=6&filter=text&type=photo';

    request.get({ url: url, json: true }, function(err, response, body) {
        if (err || !body.response.posts) {
            return done(self.data);
        }

        var PORTRAIT_WIDTH = 422;

        var posts = {
            photos: []
        }

        // Get the rest
        body.response.posts.forEach(function(post) {
            var photo = {};

            photo.img = post.photos[0].alt_sizes[1].url;
            photo.url = post.post_url;
            photo.caption = post.caption;

            if (post.photos[0].alt_sizes[1].width === PORTRAIT_WIDTH) {
                photo.css = 'portrait-small';
            } else {
                photo.css = 'landscape-small';
            }

            posts.photos.push(photo);
        });

        done(posts);
    });
}).at('0 1,2 * * *');