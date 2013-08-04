// Github figures and stats

var request = require('request');

/*
 * Returns info about my github project activity.
 * This only take into account my public feed.
 */
job('projects', function(done) {
    var url = 'https://api.github.com/users/tmrudick/events/public';

    request.get({ url: url, json: true, headers: { 'User-Agent': 'tomrudick.com :: tmrudick@gmail.com' } }, function(err, response) {
        if (err) {
            return done();
        }

        // Sort the events by date
        response.body.sort(function(evt1, evt2) {
            return new Date(evt1.created_at) > new Date(evt2.created_at);
        });

        // Loop over them and take the first PushEvent
        for (var i = 0; i < response.body.length; i++) {
            var event = response.body[i];

            if (event.type === 'PushEvent') {
                return done({
                    most_recent: project_from_event(event)
                });
            }
        }

        // No push event? Since this means that I haven't commited any code in the last
        // 30 days or so, it probably means that I've got bigger problems in my life
        // than having really robust error handling code here...
        done();
    });
}).every('1 day');

// Given an event, return the friendly repo name and url
function project_from_event(event) {
    var project = {};
    var user_prefix = 'tmrudick/';
    var github_url = 'https://github.com/';

    project.url = github_url + event.repo.name;
    project.name = event.repo.name;

    if (event.repo.name.indexOf(user_prefix) === 0) {
        project.name = project.name.substring(user_prefix.length);
    }

    return project;
}