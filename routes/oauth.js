var express = require('express');
var router = express.Router();
var passport = require('passport');

// GET /auth/twitter
router.get('/auth/twitter', passport.authenticate('twitter', { scope: ['public_profile'] }), function(req, res) {
    console.log('oauth.js: /auth/twitter');
});

// GET /auth/twitter/callback
router.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
    console.log('oauth.js: /auth/twitter/callback');
    res.redirect('/');
});

module.exports = router;
