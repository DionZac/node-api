//*******************************************************************************************
// Server request handlers
//   check: http://getfuelux.com/
//*******************************************************************************************
var app         = require('./app.js');
var glib        = require('./glib.js');
var dbs         = require('./dbs.js');
var objects		= require('./db.js');
var api         = require('./api.js');

var appReq      = {};
////////////////////////////////////////////////////////////
// API: Register handlers for requests
////////////////////////////////////////////////////////////


exports.login = async (req,res) => {
	let users = await objects.databases.users.get();

	// delete users[0]['rowid'];
	res.send(users[0]);
}
