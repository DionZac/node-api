var app = require('./app.js');
var objects = require('./db.js');

exports.TokenAuthorization = class {
    constructor(){
        this.profiles_name = app.settings.profiles_name || 'users';
        this.users = objects.databases[this.profiles_name];
    }

    authorize(params){
        return new Promise(async (resolve, reject) => {
            if(!('token' in params)){
                reject('No token parameter');
                return;
            }

            let token = params.token;

            let user = await this.users.filter({token:token});
            if(user && user.length > 0){
                user = user[0];
                resolve(user);
            }

            reject('Could not authorize the user');
        })
    }

}