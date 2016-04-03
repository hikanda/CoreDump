var express = require('express');
var router = express.Router();
var csurf = require('csurf');

router.get('/', function(req, res){
    if(req.user !== undefined) {
	console.log('logined!');
	console.log(req.user.displayName);
	console.log(req.user.photos[0].value);
	console.log(req.user.id);

	res.render('index', {
	    user: req.user,
	    name: req.user.displayName,
	    imgurl: req.user.photos[0].value,
	    id: req.user.id,
	    csrf: req.csrfToken(),
	    data: []
	});
    }
    else {
	console.log('not login...');
	res.render('index', { user: req.user });
    }
});

module.exports = router;
