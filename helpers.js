module.exports = function(Handlebars) {
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

    Handlebars.registerHelper('toMi', function(meters) {
        return (meters / 1609).toFixed(2);
    });
};