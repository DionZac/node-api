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

        async __insert__(self,params){
            let res = self.res;
            try{
                let record = dbs.newRecord(this.db.db, params);
                record.token = this.generateUserToken();
                let obj = await this.db.insert(record);
                console.log('Success');
                res.send({err:0, user:obj });
            }
            catch(err){
                console.log('Error');
                this.__handle_error__(res,err);
            }
        }

        

        generateUserToken(){
            let tokenStringLength = 128;
            var stringArray = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','!','?'];
            var rndString = '';
            for(var i=0; i<tokenStringLength; i++){
                var rndNum = Math.ceil(Math.random() * stringArray.length) - 1;
                rndString = rndString + stringArray[rndNum];
            }

            return rndString;
        }

        serialize_username(username){
            return 'Serialized username : ' + username;
        }

        deserialize_username(username){
            return 'Deserialized username : ' + username;
        }
    }
    