    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.funbetsResource = class extends master.masterResource {
        constructor(){
            super();
            this.funbets = db.funbets;
            super.initialize(this.funbets);
        }
        
        __authorize__(self){
            // authorization for all requests of funbets
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
    