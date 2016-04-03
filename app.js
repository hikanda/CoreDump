var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var pg = require('pg');
var csurf = require('csurf');

var LOCAL_DATABASE_URL = 'postgres:user:password@localhost:port/db';
var conURL = process.env.DATABASE_URL || LOCAL_DATABASE_URL;
pg.defaults.ssl = true;

var app = express();
var index = require('./routes/index');
var passport = require('./routes/passport');
var oauth = require('./routes/oauth');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride(function(req, res) {
    if (req.body &&
	typeof req.body === 'object' &&
	'_method' in req.body) {

	// look in urlencoded POST bodies and delete it
	var method = req.body._method;
	delete req.body._method;
	return method;
    }
}));
app.use(session({
    secret: 'deadbeef',
    resave: false,
    saveUninitialized: false
}));
app.use(csurf());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', index);
app.get('/auth/twitter', oauth);
app.get('/auth/twitter/callback', oauth);

app.post('/posts/post', function(req, res, next) {
    var name = req.body["name"];
    var memo = req.body["memo"];

    if (memo !== '') {
	pg.connect(conURL, function(err, client) {
	    if (err) throw err;

	    var query_ts = client.query("select to_char(current_timestamp, 'YYYY-MM-DD HH24:MI:SS.US');");
	    var timestamp = '';

	    query_ts.on('row', function(row) {
		timestamp = row.to_char;
	    });
	    query_ts.on('end', function(result) {
		console.log([timestamp, name, memo]);
		var qstr = "insert into core (ts,name,memo) values($1, $2, $3);";
		var query = client.query(qstr, [timestamp, name, memo]);
		
		query.on('end', function(result) {
		    res.redirect('/posts/show');
		});
		query.on('error', function(error) {
		    console.log(error);
		    res.redirect('/');
		});
	    });
	    query_ts.on('error', function(error) {
		console.log(error);
		res.redirect('/');
	    });
	});
    } else {
	console.log('memo is empty.');
	res.redirect('/');
    }
});

app.get('/posts/show', function(req, res, next) {
    pg.connect(conURL, function(err, client) {
	if (err) throw err;

	var qstr = "select * from core order by ts desc;";
	var query = client.query(qstr);
	var rows = [];

	query.on('row', function(row) {
	    rows.push(row);
	});
	query.on('end', function(result) {
	    res.render('index', {
		user: req.session.passport.user,
		name: req.session.passport.user.displayName,
		imgurl: req.session.passport.user.photos[0].value,
		id: req.session.passport.user.id,
		csrf: req.csrfToken(),
		data: rows
	    });
	});
	query.on('error', function(error) {
	    console.log(error);
	    res.redirect('/');
	});
    });
});

app.get('/posts/show/:name', function(req, res, next) {
    pg.connect(conURL, function(err, client) {
	if (err) throw err;

	var qstr = "select * from core where name = \'" + req.params.name + "\' order by ts desc;";
	var query = client.query(qstr);
	var rows = [];

	console.log(qstr);
	query.on('row', function(row) {
	    rows.push(row);
	});
	query.on('end', function(result) {
	    res.render('index', {
		user: req.session.passport.user,
		name: req.session.passport.user.displayName,
		imgurl: req.session.passport.user.photos[0].value,
		id: req.session.passport.user.id,
		csrf: req.csrfToken(),
		data: rows
	    });
	});
	query.on('error', function(error) {
	    console.log(error);
	    res.redirect('/');
	});
    });
});

app.delete('/posts/:id', function(req, res, next) {
    var postid = req.params.id;

    pg.connect(conURL, function(err, client) {
	if (err) throw err;

	var qstr = "delete from core where id = $1;";
	var query = client.query(qstr, [postid]);

	query.on('end', function(result) {
	    res.redirect('/posts/show');
	});
	query.on('error', function(error) {
	    console.log(error);
	    res.redirect('/');
	});
    });
});

app.put('/posts/update/:id', function(req, res, next) {
    var postid = req.params.id;
    var memo = req.body["memo"];

    pg.connect(conURL, function(err, client) {
	if (err) throw err;

	var query_ts = client.query("select to_char(current_timestamp, 'YYYY-MM-DD HH24:MI:SS.US');");
	var timestamp = ''

	query_ts.on('row', function(row) {
	    timestamp = row.to_char;
	});
	query_ts.on('end', function(result) {
	    var qstr = "update only core set ts = $1, memo = $2 where id = $3;";
	    var query = client.query(qstr, [timestamp, memo, postid]);

	    query.on('end', function(result) {
		res.redirect('/posts/show');
	    });
	    query.on('error', function(error) {
		console.log(error);
		res.redirect('/');
	    });
	});
	query_ts.on('error', function(error) {
	    console.log(error);
	    res.redirect('/');
	});
    });
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
	    message: err.message,
	    error: err
	});
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
	message: err.message,
	error: {}
    });
});


module.exports = app;
