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
				nation["league"] = "Nations League";
				data["teams"].push(nation);
			}

			res.send(data);
		});
	});
}

exports.european = async(req,res) => {
	try{
		let data = {
			champions_league: JSON.parse(await fs.readFileSync('./assets/champions_league.json')),
			europa_league: JSON.parse(await fs.readFileSync('./assets/europa_league.json')),
			conference_league: JSON.parse(await fs.readFileSync('./assets/conference_league.json'))
		};

		res.send(data);
	}
	catch(e){
		res.send([]);
	}
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
	let paroli = await db.paroli.filter({account_uid:uid});

	for(let p of paroli){
		p.bets = [];
		for(key in p){
			if(key.indexOf('bets_') > -1){
				p.bets.push(p[key]);
				delete p[key];
			}
		}
	}

	let months = {
		"all": {
			"singles": singles,
			"live": live,
			"paroli": paroli
		}
	};

	for(let bet of singles){
		if(bet.month == "August") bet.month = "08";
		if(bet.month == "September") bet.month = "09";
		if(bet.month == "October") bet.month = "10";
		if(bet.month == "November") bet.month = "11";
		if(bet.month == "December") bet.month = "12";
		if(bet.month == "January") bet.month = "01";
		if(bet.month == "February") bet.month = "02";
		if(bet.month == "March") bet.month = "03";
		if(bet.month == "April") bet.month = "04";
		if(bet.month == "May") bet.month = "05";
		if(bet.month == "June") bet.month = "06";
		if(bet.month == "July") bet.month = "07";

		if(months[bet.month]){
			months[bet.month].singles.push(bet);
		}
		else{
			months[bet.month] = {
				"singles": [bet],
				"live": [],
				"paroli": []
			}
		}
	}

	for(let bet of live){
		if(bet.month == "August") bet.month = "08";
		if(bet.month == "September") bet.month = "09";
		if(bet.month == "October") bet.month = "10";
		if(bet.month == "November") bet.month = "11";
		if(bet.month == "December") bet.month = "12";
		if(bet.month == "January") bet.month = "01";
		if(bet.month == "February") bet.month = "02";
		if(bet.month == "March") bet.month = "03";
		if(bet.month == "April") bet.month = "04";
		if(bet.month == "May") bet.month = "05";
		if(bet.month == "June") bet.month = "06";
		if(bet.month == "July") bet.month = "07";
		
		if(months[bet.month]){
			months[bet.month].live.push(bet);
		}
		else{
			months[bet.month] = {
				"live": [bet]
			}
		}
	}

	for(let bet of paroli){
		if(bet.month == "August") bet.month = "08";
		if(bet.month == "September") bet.month = "09";
		if(bet.month == "October") bet.month = "10";
		if(bet.month == "November") bet.month = "11";
		if(bet.month == "December") bet.month = "12";
		if(bet.month == "January") bet.month = "01";
		if(bet.month == "February") bet.month = "02";
		if(bet.month == "March") bet.month = "03";
		if(bet.month == "April") bet.month = "04";
		if(bet.month == "May") bet.month = "05";
		if(bet.month == "June") bet.month = "06";
		if(bet.month == "July") bet.month = "07";
		
		if(months[bet.month]){
			months[bet.month].paroli.push(bet);
		}
		else{
			months[bet.month] = {
				"paroli": [bet]
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
