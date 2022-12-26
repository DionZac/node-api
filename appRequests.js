//*******************************************************************************************
// Server request handlers
//   check: http://getfuelux.com/
//*******************************************************************************************
var app         = require('./app.js');
var glib        = require('./glib.js');
var handler     = require('./handler.js');

var fs = require('fs');

var appReq      = {};
////////////////////////////////////////////////////////////
// API: Register handlers for requests
////////////////////////////////////////////////////////////

exports.nbaTeams = async(req,res) => {
	fs.readFile('./assets/nba_teams.json', (err, data) => {
		res.send(JSON.parse(data));
	})
}

exports.nbaBetCategories = async(req, res) => {
	fs.readFile('./assets/nba_bet_categories.json', (err, data) => {
		res.send(JSON.parse(data));
	})
}

exports.teams = async(req,res) => {
	fs.readFile('./assets/teams.json', (err, data) => {
		res.send(JSON.parse(data));
	});
}

exports.leagues = async(req, res) => {
	fs.readFile('./assets/leagues.json', (err, data) => {
		res.send(JSON.parse(data));
	});
}

exports.categories = async(req, res) => {
	fs.readFile('./assets/bet_categories.json', (err, data) => {
		res.send(JSON.parse(data));
	});
}

exports.allBets = async(req,res) => {
	let bets = await db.bets.get();
	let singles = await db.singles.get();
	let paroli = await db.paroli.get();
	let live = await db.live.get();
	let nba = await db.nba.get();
	let nba_bets = await db.bets.filter({league:'nba'});
	let funbets = await db.funbets.get();


	res.send({
		bets,
		singles,
		paroli,
		live,
		nba,
		nba_bets,
		funbets
	});

}

exports.login = async (req,res) => {
	let users = await db.users.get();

	// delete users[0]['rowid'];
	res.send(users[0]);
}
