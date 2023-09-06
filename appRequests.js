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
		data = JSON.parse(data);
		fs.readFile('./assets/nations.json', (err, nations) => {
			nations = JSON.parse(nations);
			for(let nation of nations.teams){
				nation["league"] = "EURO Qualification";
				data["teams"].push(nation);
			}

			res.send(data);
		});
	});
}

exports.leagues = async(req, res) => {
	fs.readFile('./assets/leagues.json', (err, data) => {
		data = JSON.parse(data);
		res.send(data);
	});
}

exports.categories = async(req, res) => {
	fs.readFile('./assets/bet_categories.json', (err, data) => {
		res.send(JSON.parse(data));
	});
}

exports.monthly = async(req,res) => {
	let uid = req.headers.user;

	let singles = await db.singles.filter({account_uid: uid});
	let live = await db.live.filter({account_uid: uid});

	let months = {
		"all": {
			"singles": singles,
			"live": live
		}
	};

	for(let bet of singles){
		if(bet.month == "August") bet.month = "08";
		if(bet.month == "September") bet.month = "09";
		if(bet.month == "October") bet.month = "10";
		if(bet.month == "November") bet.month = "11";

		if(months[bet.month]){
			months[bet.month].singles.push(bet);
		}
		else{
			months[bet.month] = {
				"singles": [bet],
				"live": []
			}
		}
	}

	for(let bet of live){
		if(bet.month == "August") bet.month = "08";
		if(bet.month == "September") bet.month = "09";
		if(bet.month == "October") bet.month = "10";
		if(bet.month == "November") bet.month = "11";
		
		if(months[bet.month]){
			months[bet.month].live.push(bet);
		}
		else{
			months[bet.month] = {
				"live": [bet]
			}
		}
	}

	res.send(months);
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
