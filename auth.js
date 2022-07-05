var app = require('./app.js');
var objects = require('./db.js');



//// Set this class to a resource 'Meta.AUTHORIZATION_CLASS' in order to include token auth in all requests of it's endpoint ///
/// resource can have safe auth methods that will pass authorization ///
exports.TokenAuthorization = class {
    constructor(){
        this.profiles_name = app.settings.profiles_name || 'users';
        this.users = objects.databases[this.profiles_name];
    }

    authorize(params,method,safe){
        return new Promise(async (resolve, reject) => {
            if(safe && this.is_safe_method(method,safe)){
                resolve({safe:true});
                return;
            }

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

            reject('Token is invalid or expired');
        })
    }

    is_safe_method(method,safe){
        if(safe.includes(method)) return true;

        return false;
    }
}

exports.feedAuthorization = class {
    constructor(){

    }

    modify_object(params,obj){
        if(!('token' in params)) return false;

        if(params.token == obj.token) return true;

        return false;
    }
}