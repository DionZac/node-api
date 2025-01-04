import { http } from "../libs/http.js";

class Collection {
    records = [];

    constructor(params) {

    }

    async get(id){
        if(id) return await http.get(this.endpoint + "/" + id);

        return await http.get(this.endpoint);
    }

    async create(object){
        try{
            let res = await http.post(this.endpoint, object);
            if(res.err == 0 && res.rowid) object.rowid = res.rowid;
            this.records.push(object);
        }
        catch(e){

        }
    }

    async update(object){
        let endpoint = this.endpoint + "/" + object.rowid;
        try{
            await http.put(endpoint, object);
        }
        catch(e){}
    }

    delete(id){
        return http.delete(this.endpoint + "/" + id);
    }

    find(id){
        for(let record of this.records){
            if(record.rowid == id) return record;
        }
    }
}

export default Collection;