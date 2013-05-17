var request = require('request'),
    moment = require('moment'),
    tumblr_api_key = require('../config.json').tokens.tumblr.api_key;

job('eight30six', '0 21,22 * * *', function(done) {
    var url = 'http://api.tumblr.com/v2/blog/eight30six.tumblr.com/posts?api_key=' + tumblr_api_key + '&limit=7&filter=text';
    request.get({ url: url, json: true }, function(err, response, body) {
        var LARGE_SIZE = 281;
        var SMALL_SIZE = 140;

        var posts = {
            recent: {},
            previous: []
        }

        // Pick out the newest (largest img)
        var newest_post = body.response.posts.shift();
        posts.recent.img = newest_post.photos[0].alt_sizes[1].url;
        posts.recent.url = newest_post.post_url;
        posts.recent.caption = newest_post.caption;
        if (newest_post.photos[0].alt_sizes[1].width === 422) {
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
});