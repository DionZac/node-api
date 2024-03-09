    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.courtsResource = class extends master.masterResource {
        constructor(){
            super();
            this.courts = db.courts;
            super.initialize(this.courts);
        }
        
        __authorize__(self){
            // authorization for all requests of courts
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }

        async deserialize(rec){
            if(rec.shop_id){
                let id = rec.shop_id.rowid;
                rec.shop = JSON.parse(JSON.stringify(rec.shop_id));
                rec.shop_id = id;
            }

            return rec;
        }
    }
    