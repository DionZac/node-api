//*******************************************************************************************
// Server request handlers
//   check: http://getfuelux.com/
//*******************************************************************************************
var app         = require('./app.js');
var glib        = require('./glib.js');
var dbs         = require('./dbs.js');
var objects		= require('./db.js');
var handler     = require('./handler.js');

var login       = require('./resources/loginResource.js');

var appReq      = {};
////////////////////////////////////////////////////////////
// API: Register handlers for requests
////////////////////////////////////////////////////////////


exports.login = async (req,res) => {
	var params = glib.getRequestParams(req);
	let _login = new login.loginResource();
	_login.__insert__({req:req, res:res})
}
