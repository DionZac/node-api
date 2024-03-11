class API {
    mainUrl = "http://192.168.2.4:9000/api/v1";
    constructor(){

    }

    request(options){
        return new Promise((resolve,reject) => {
            try{
                $.ajax(options).then( (result,status)  => {
                    if(status !== "success"){
                        reject(result);
                    }
                    else{
                        try{result = JSON.parse(result);}
                        catch(e){};

                        resolve(result);
                    }
                    
                }).catch(error => {
                    reject(error);
                })
            }
            catch(e){
                reject(e);
            }
        });
    }

    get(model, id, data){
        let url = this.mainUrl; 
        url += `/${model}`;
        if(id && id > 0){
            url += `/${id}`;
        }

        let options = {
            method: 'GET',
            headers: {},
            url: url,
            data: data
        };

        return this.request(options);
    }

    post(model, object){
        let url = `${this.mainUrl}/${model}`;
        let options = {
            method : 'POST',
            headers: {},
            url:url,
            data: object
        }

        return this.request(options);
    }

    put(model, object){
        let url = `${this.mainUrl}/${model}/${object.rowid}`;
        let options = {
            method : 'PUT',
            headers: {},
            url:url,
            data: JSON.stringify(object)
        }

        return this.request(options);
    }

    delete(model, object){
        let id;
        if(typeof(object) == "object" ) id = object.rowid;
        else id = object;
        
        let url = `${this.mainUrl}/${model}/${id}`;
        let options = {
            method : 'DELETE',
            headers: {},
            url:url
        }

        return this.request(options);
    }
}

export default API;