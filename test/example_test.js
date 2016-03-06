var app = require('../example');
var supertest = require('supertest')(app);

it('return HTTP 200 OK', function(done) {
    supertest
	.get('/hello')
	.expect(200)
	.expect('Hello World')
	.end(done);
});
