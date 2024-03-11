    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.profileResource = class extends master.masterResource {
        constructor(){
            super();
            this.profile = db.profile;
            super.initialize(this.profile);
        }
        
        __authorize__(self){
            // authorization for all requests of profile
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
    