    var glib    = require("../glib.js");
    var objects = require("../db.js");
    var dbs     = require("../dbs.js");
    var master  = require("./master.js");
    
    exports.usersResource = class extends master.masterResource {
        constructor(){
            super();
            this.users = objects.databases.users;
            super.initialize(this.users);
        }
        
        __authorize__(self){
            // authorization for all requests of users
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
    