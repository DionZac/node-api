    var glib    = require("../glib.js");
    var objects = require("../db.js");
    var dbs     = require("../dbs.js");
    var master  = require("./master.js");
    
    exports.feedResource = class extends master.masterResource {
        constructor(){
            super();
            this.feed = objects.databases.feed;

            this.Meta = {
                AUTHORIZATION_CLASS:[
                    'TokenAuthorization',
                    'feedAuthorization'
                ],
                allowed_methods:['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
            }

            this.private_fields = [
                'token'
            ]

            super.initialize(this.feed);
        }
    }
    