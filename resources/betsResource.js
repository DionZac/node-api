    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.betsResource = class extends master.masterResource {
        constructor(){
            super();
            this.bets = db.bets;
            super.initialize(this.bets);
        }
        
        __authorize__(self){
            // authorization for all requests of bets
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
    