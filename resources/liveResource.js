    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.liveResource = class extends master.masterResource {
        constructor(){
            super();
            this.live = db.live;
            super.initialize(this.live);
        }
        
        __authorize__(self){
            // authorization for all requests of live
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
    