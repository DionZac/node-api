class API {
    mainUrl = "http://localhost:9000/api/v1";
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

    get(model, id){
        let url = this.mainUrl; 
        url += `/${model}`;
        if(id && id > 0){
            url += `/${id}`;
        }

        let options = {
            method: 'GET',
            headers: {},
            url: url
        };

        return this.request(options);
    }

    post(model, object){
        let url = `${this.mainUrl}/${model}`;
        let options = {
            method : 'POST',
            headers: {},
            url:url,
            body: JSON.stringify(object)
        }

        return this.request(options);
    }
}

export default API;