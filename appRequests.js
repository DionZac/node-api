//*******************************************************************************************
// Server request handlers
//   check: http://getfuelux.com/
//*******************************************************************************************
var app         = require('./app.js');
var glib        = require('./glib.js');
var handler     = require('./handler.js');

var appReq      = {};
////////////////////////////////////////////////////////////
// API: Register handlers for requests
////////////////////////////////////////////////////////////

exports.allBets = async(req,res) => {
	let bets = await db.bets.get();
	let singles = await db.singles.get();
	let paroli = await db.paroli.get();
	let live = await db.live.get();



	res.send({
		bets,
		singles,
		paroli,
		live
	});

}

exports.login = async (req,res) => {
	let users = await db.users.get();

	// delete users[0]['rowid'];
	res.send(users[0]);
}
