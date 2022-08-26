    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.paroliResource = class extends master.masterResource {
        constructor(){
            super();
            this.paroli = db.paroli;
            super.initialize(this.paroli);
        }
        
        __authorize__(self){
            // authorization for all requests of paroli
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
    