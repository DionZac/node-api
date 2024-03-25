    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.matchesResource = class extends master.masterResource {
        constructor(){
            super();
            this.matches = db.matches;
            super.initialize(this.matches);
        }
        
        __authorize__(self){
            // authorization for all requests of matches
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }

        deserialize_court(court){
            if(court.shop_id){
                court.shop_id = court.shop_id.rowid;
            }

            return court;
        }

        async serialize(match){
            try{
                match.player_1 = match.players.team_1.player_1.rowid;
                match.player_2 = match.players.team_1.player_2.rowid;
                match.player_3 = match.players.team_2.player_1.rowid;
                match.player_4 = match.players.team_2.player_2.rowid;
            }
            catch(e){

            }

            try{
                match.balls = match.extras.balls;
                match.rackets = match.extras.rackets;
            }
            catch(e){}

            try{
                match.court = match.court.rowid;
                match.shop = match.shop.rowid;
            }
            catch(e){
            }

            return match;
        }
    }
    