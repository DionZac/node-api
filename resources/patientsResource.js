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
    }
    