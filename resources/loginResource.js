var glib    = require("../glib.js");
var master  = require("./master.js");

exports.usersResource = class extends master.masterResource {
    constructor(){
        super();


    }

    async __insert__(self,params){
        glib.serverlog('LOGIN ATTEMPT');
        self.res.status(404);
        self.res.send('Not found')
    }

}