    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.patientsResource = class extends master.masterResource {
        constructor(){
            super();
            this.patients = db.patients;
            super.initialize(this.patients);
        }
        
        __authorize__(self){
            // authorization for all requests of patients
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }


        deserialize(patient){
            for(let attr in patient){
                if(patient[attr] == "null") patient[attr] = "";
            }

            return patient;
        }

        async __insert__(self,params){
            let res = self.res;
            try{
                let insert = await this.db.insert(params);
                res.send({err: 0 , rowid: insert});
            }
            catch(err){
                glib.serverlog(err, 0);
                this.__handle_error__(res,err);
            }
        }
    }
    