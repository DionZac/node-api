var glib    = require("../glib.js");
var objects = require("../db.js");
var dbs     = require("../dbs.js");
var master  = require("./master.js");
const { serializeData } = require("../handler.js");

exports.loginResource = class extends master.masterResource {
    constructor(){
        super();

        this.users = objects.databases.users;
    }

    async __insert__(self,params){
        params = glib.getRequestParams(self.req);

        let user;
        try{
            user = await this.users.filter({email: params.email, password: params.password});
        }
        catch(e){};

        if(!user || user.length == 0){
            self.res.send('User not found');
            return;
        }

        self.res.send(user[0]);
    }

}