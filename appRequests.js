//*******************************************************************************************
// Server request handlers
//   check: http://getfuelux.com/
//*******************************************************************************************
var app         = require('./app.js');
var glib        = require('./glib.js');
var dbs         = require('./dbs.js');
var objects		= require('./db.js');
var api         = require('./api.js');

var request     = require('request');

var appReq      = {};
////////////////////////////////////////////////////////////
// API: Register handlers for requests
////////////////////////////////////////////////////////////



exports.registerRequestServices = function(server)
{
  server.all('/login', appReq.login);

  server.all('/api/v1/*', api.call);
}


appReq.login = async (req,res) => {
	let users = await objects.databases.users.get();

	// delete users[0]['rowid'];
	res.send(users[0]);
}
