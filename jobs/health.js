// Gets health/bio related data about me

/* Returns how many years I have been programming. This is 
 * just some simple math assuming that I started programming
 * when I was 10 years old.
 *
 * Only want this to run once a day since I don't care about
 * intra-day accuracy of this pretty useless metric.
 */
job('programming_age', '1 day', function(done) {
    // Get today without any time portion
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get my birthday + 10 years
    var started_programming = new Date(1996, 9, 21);

    // Calculate the number of years out to two decimals
    var diff = today.getTime() - started_programming.getTime();
    var years = Math.floor(diff / 10 / 60 / 60 / 24 / 365) / 100;

    done(years);
});