var express = require('express');
var app = express();

app.get('/hello', function(request, response) {
    response.send('Hello World!');
});

module.exports = app;

if (!module.parent) {
    app.listen(3000, function() {
	console.log('Example app listening on port 3000');
    });
}
