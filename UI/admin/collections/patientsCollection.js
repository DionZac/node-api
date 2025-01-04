import Collection from "./collection.js";
import Patient from "../objects/patient.js";

class PatientsCollection extends Collection {
    endpoint = "patients";

    default_profile_picture = "https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839683_6nAPzbhpSkIpb8pmAwufkC7c5eD7wYws.jpg";
    
    constructor(params) {
        super(params);
    }


    async get(id){
        let records = await super.get(id);

        for(let record of records){
            record.fullname = record.firstname + " " + record.lastname;
            if(!record.picture) record.picture = this.default_profile_picture;

            this.records.push(new Patient(record));
        }

        return this.records;
    }

    async create(object){
        if(object && !object.fullname) object.fullname = object.firstname + " " + object.lastname;
        if(object && !object.picture) object.picture = this.default_profile_picture;

        await super.create(object);
    }

    async update(object){
        object.fullname = object.firstname + " " + object.lastname;
        if(!object.picture) object.picture = this.default_profile_picture;
        
        await super.update(object);
    }
}

export default PatientsCollection;