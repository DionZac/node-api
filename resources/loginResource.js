var glib    = require("../glib.js");
var objects = require("../db.js");
var dbs     = require("../dbs.js");
var master  = require("./master.js");

exports.usersResource = class extends master.masterResource {
    constructor(){
        super();


    }

    async __insert__(self,params){
        console.log('LOGIN ATTEMPT');
        self.res.status(404);
        self.res.send('Not found')
    }

}