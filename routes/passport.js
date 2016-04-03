var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

// 環境変数で指定する
var TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;

var LOCAL_TWITTER_CALLBACK_URL = "http://localhost:3000/auth/twitter/callback";

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new TwitterStrategy(
    {
	consumerKey: TWITTER_CONSUMER_KEY,
	consumerSecret: TWITTER_CONSUMER_SECRET,
	callbackURL: process.env.TWITTER_CALLBACK_URL || LOCAL_TWITTER_CALLBACK_URL
    },
    function(token, tokenSecret, profile, done) {
	process.nextTick(function() {
	    return done(null, profile);
	});
    }
));

module.exports = passport;
