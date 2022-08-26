    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.singlesResource = class extends master.masterResource {
        constructor(){
            super();
            this.singles = db.singles;
            super.initialize(this.singles);
        }
        
        __authorize__(self){
            // authorization for all requests of singles
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
    