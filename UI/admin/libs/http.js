export const http = {
    // url : 'http://192.168.2.4:9000',
    url: 'http://localhost:9000/api/v1/',
    get: async (url) => {
        return await http.request(url, "GET");
    },
    post: async (url, data) => {
        return await http.request(url, "POST", data);
    },
    put: async (url, data) => {
        return await http.request(url, "PUT", data);
    },
    delete: async (url) => {
        return await http.request(url, "DELETE");
    },

    request: (endpoint, method, data) => {
        return new Promise((resolve , reject) => {
            try{
                let obj = {
                    method: method,
                    url: http.url + endpoint,
                     headers: {user: "cgnv4z1bjyron8t6"}
//                    headers: {user : "91w4brrj7r"}
                }
                if(data) obj['data'] = data;

                $.ajax(obj).then (data => {
                    try{ data = JSON.parse(data);}
                    catch(e){};

                    resolve(data);
                })
            }
            catch(e){
                reject(e);
            }
        })
    }
}
