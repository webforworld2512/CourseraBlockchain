'use strict';

var express = require("express"),
	routes = require("./routes"),
	bodyParser = require('body-parser');

var app = express();
var port = 8080;

app.disable('etag');
app.use('/', express.static(__dirname + '/public/'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.listen(port);

app.post('/api/configureEthereum:type', routes.configureEthereum);
app.post('/api/ethereum:type', routes.ethereum);
app.post('/api/startWeb3', routes.startWeb3);
app.post('/api/checkEthereum', routes.checkEthereum);
app.post('/api/deleteEverything', routes.deleteEverything);
app.get('/api/submitScore', routes.submitScore);
app.get('/api/checkDAG', routes.checkDAG);

console.log("Script started. Head over to http://localhost:"+port+ " on your browser");