    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.shopsResource = class extends master.masterResource {
        constructor(){
            super();
            this.shops = db.shops;
            super.initialize(this.shops);
        }
        
        __authorize__(self){
            // authorization for all requests of shops
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
    