var glib        = require('./glib.js');
var handler     = require('./handler.js');

var appRequests = require('./appRequests');
// var registered  = require('./registered.js');

exports.registerRequestServices = function(server){
    server.all('/login', appRequests.login);

    server.all('/api/v1/*', handler.call);
}

var get_function_name_from_method = function(method){
    switch(method){
        case 'GET': case 'get':
            return('__get__');
        case 'POST': case 'post':
            return('__insert__');
        case 'PUT' : case 'put':
            return('__update__');
        case 'DELETE': case 'delete':
            return('__remove__');
        default:
            return('__unhandled__');
    }
}

exports.check_endpoint = async function(endpoint){
    try{
        var registered = await glib.readJSONfile('./registered.json');
        try{ registered = JSON.parse(registered);}
        catch(err){}
    }
    catch(err){
        console.log('Failed to read registered endpoints');
        return false;
    }

    console.log('Registered : ' + JSON.stringify(registered));

    for(let reg of registered.registered_endpoints){
        if(reg.endpoint == endpoint) return reg;
    }

    return false;
}


var check_registered_databases = function(path){


}

// uri -> array of what's left after the endpoint is cut ///
exports.url_mapping = (endpoint, method, uri) => {
    var obj = this.check_endpoint(endpoint);
    if(!obj){ console.log('No registered endpoint : ' + endpoint); return false;}

     /// Check request method -- return the proper function ////
    if(uri.length  == 0) {
        let fnname = get_function_name_from_method(method);
        return{fnname:fnname, dbname:endpoint};
    }

    if(uri.length == 1){
        let num = uri[0];
        let kwargs = {};
        try{
            if(num == '') throw('');
            let rowid = parseInt(num);
            if(typeof(rowid) !== 'number' || isNaN(rowid)) throw('')
            kwargs.rowid = rowid;
            let fnname = get_function_name_from_method(method);
            return{fnname:fnname, dbname:endpoint, kwargs:kwargs};
        }
        catch(err){
            //// return 'method_call' to catch in 'api' in order to check if resource has such function to call ////
            return{dbname:endpoint, fnname:uri[0]}
        }
    }

    if(uri.length > 1){
        let out = [];
        console.log('URI :::::::::::: ' , uri);
        for(let i=0; i<uri.length-1; i++) out.push(uri[i]);
        let last = uri.pop();
        let rowid;
        try{
            rowid = parseInt(last);
        }
        catch(err){
            out.push(last);
        }
        console.log('ROWID : ::::::: ' ,rowid);
        //// if more than one --- return all endpoints after /transactions/ ----
        ///// if last is number --- consider it as id 
        if(rowid) return {dbname:endpoint , methods:out, rowid:rowid};
        return {dbname:endpoint, methods:out};
    }
}