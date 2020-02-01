var glib    = require('./glib.js');
var objects = require('./db.js');
var app     = require('./app.js');
var urls    = require('./urls.js');
var __auth__    = require('./auth.js');

var resources = require('require-all')(__dirname + '/resources');

exports.references = {}; /// resource references
exports.auth = {}; /// authorization classes reference
var handler = this;


var _url     = require('url');

const settings = app.settings;

exports.intialize_resources = async() => {
    var registered = await glib.readJSONfile('./registered.json');
    console.log(registered);
    registered = JSON.parse(registered);
    if('registered_endpoints' in registered){
        var endpoints = registered.registered_endpoints;
        for(let end of endpoints){
            if('resource' in end){
                if(!handler[end.resource]){
                    console.log('Creating resource class instance for ' + end.resource);

                    if(!(end.resource in resources)){
                        console.log('Missing ' + end.resource + ' file on resources folder');
                        continue;
                    }

                    if(!(end.resource in resources[end.resource])){
                        console.log('Missing ' + end.resource + ' class in resource class file');
                        continue;
                    }

                    var db = new resources[end.resource][end.resource]();
                    handler[end.dbname] = db;
                }
            }
        }
    }
}

// ===========================
// == INITIALIZE THE AUTHORIZATION CLASSES
// == AND STORE THEM GLOBALLY
// ===========================
exports.initializeAuthorizationClasses = async (req,res) => {
    var auth_classes = await glib.readJSONfile('./authorization.json');
    console.log(auth_classes);
    auth_classes = JSON.parse(auth_classes);

    let AUTH_CLASSES = auth_classes['authorization_classes'];
    for(let obj of AUTH_CLASSES){
        console.log(obj);
        /// initialize the auth class and store in the 'handler' object ///
        handler.auth[obj.name] = new __auth__[obj.classname]();
    }

    console.log('Authorization classes are initialized');
}


exports.call = async (req,res) => {
    var params = glib.getRequestParams(req);

    var self = {req:req, res:res};

    if(req.method == 'OPTIONS') { res.send('OK'); return; }

    var uri = _url.parse(req.url).pathname

    let s = uri.split(Settings.api_endpoint);

    s.shift();
    s = s[0].split('/');

    let endpoint_database = s[0];
    endpoint_database = endpoint_database.replace('/' , '');

    s.shift() //// remove the endpoint_database --- stored above /////

    let temp = [];
    for(let _s of s) if(_s !== '') temp.push(_s);
    var map = urls.url_mapping(endpoint_database, req.method, temp);
    console.log("URL map -> " , map);

    if('methods' in map){
        if(map.methods.length > 1){
            for(let i=0; i<map.methods.length-1; i++){
                resource_call(map.methods[i], map.dbname, params, self, req.method);
            }
        }
        let lastmethod = map.methods.pop();
        if('rowid' in map){
            let kwargs = {rowid:map.rowid};
            resource_call(lastmethod, map.dbname, params, self,req.method, kwargs);
        }
        else{
            resource_call(lastmethod, map.dbname, params, self, req.method);
        }
    }


    else resource_call(map.fnname, map.dbname, params, self, req.method,map.kwargs);
}


var resource_call = async function(fn,dbname,parameters, self, method, kwargs){
    if(!objects.databases[dbname]) { throw new Error("Resource " + dbname + "  model missing"); }

    var dbmodel = objects.databases[dbname];

    var resourceName = dbmodel.db.resourceName;

    if(!handler[dbname]) {
        console.log('Creating resource class instance');
        console.log(resources);

        if(!(resourceName in resources)){
            console.log('Missing ' + resourceName + ' file on resources folder.');
            self.res.send('Failed');
            return;
        }

        if(!(resourceName in resources[resourceName])){
            console.log('Missing ' + resourceName + ' class in resource class file.');
            self.res.send('Failed');
            return;
        }
        var db = new resources[resourceName][resourceName]();
        handler[dbname] = db;
    }
    else{
        var db = handler[dbname];
    }

    /// Check if request Method is allowed on this endpoint ////
    try{
        method = method.toUpperCase();
        let allowed_methods = db['Meta'].allowed_methods;
        console.log('Method : ' + method);
        console.log(allowed_methods);
        if(!allowed_methods.includes(method)) throw '';
    }
    catch(err){
        let msg = 'Not allowed request method';
        db.__handle_not_allowed_method__(self.res,msg);
        return;
    }

    /// check the settings.json for "AUTHORIZATION_CLASS" field
    /// if exists use this class authorization function
    /// to pass the authorization request
    /// this function can also be a default like 'tokenAuthorization'
    //// that I will develop in the future.
    /// NOTE : do a check if the endpoint model has an auth method first
    /// before checking the settings JSON

    var auth_class = app.settings.AUTHORIZATION_CLASS;

    if('AUTHORIZATION_CLASS' in db['Meta']){
        auth_class = db['Meta'].AUTHORIZATION_CLASS;
    }

    if(auth_class && auth_class in handler.auth && auth_class !== 'none'){
        /// check if model method is allowed without authorization ///
        let allowed = false;
        if('allowed_without_authorization' in dbmodel.db){
            for(let m of dbmodel.db.allowed_without_authorization){
                if(m == method.toUpperCase()) allowed = true;
            }
        }

        if(!allowed){
            var authorized_user;
            try{
                authorized_user = await handler.auth[auth_class].authorize(parameters);
            }
            catch(err){
                db.__authorization_failed__(self,err);
                return;
            }
            console.log('AUTHORIZED USER : ', authorized_user);
        }
    }


    try{
        //// if failed to find the database reference given /////
        // if(db.__handle_reference_error__(res)) return;

        if(fn == '__update__' || fn == '__remove__'){
            /// check if the rowid given is valid ///
            if(!db.__check_rowid__(self.res,kwargs)) return;
        }

        /// deserialize data for client ///
        if(fn == '__get__'){
            let data;
            if('filter_by' in parameters){
                data = await db.filter_by(self, parameters, kwargs);
            }
            else data = await db[fn](self,parameters,kwargs);

            if(data){
                // Modify the data //
                data = await handler.deserializeData(data,dbname);
                // console.log(data);
                self.res.send(data);
                return;
            }
            else{
                console.log(`You need to RETURN data in __get__ function of resource ${dbname}`);
                db.__function_not_found__(self.res);
                return;
            }
        }

        /// serialize data for database ///
        if(fn == '__update__' || fn == '__insert__'){
            parameters = handler.serializeData(parameters,dbname);
        }


        db[fn](self, parameters, kwargs);
    }
    catch(err){
        db.__function_not_found__(self.res);
        throw new Error(err);
    }
}

exports.serializeData = function(data,dbname){
    let db = handler[dbname];
    let fields = objects.databases[dbname].db.fields;

    for(let f of fields){
        if(!(f.fname in data)) continue;
        let serialize_function_name = 'serialize_' + f.fname;
        if(serialize_function_name in db){
            try{
                data[f.fname] = db[serialize_function_name](data[f.fname]);
            }
            catch(err){}
        }
    }

    return data;
}

exports.deserializeData =  function(data, dbname){
    return new Promise( async (resolve,  reject) => {
        let db = handler[dbname];
        let fields = objects.databases[dbname].db.fields;

        let i = 0;
        for(let entry of data){
            for(let f of fields){
                if(!(f.fname in entry)) continue;
                let deserialize_function_name = 'deserialize_' + f.fname;
                if(deserialize_function_name in db){
                    try{
                        entry[f.fname] = await db[deserialize_function_name](entry[f.fname]);
                    }
                    catch(err){
                    }
                }
            }
            data[i] = entry
            i++;
        }

        resolve(data);
    })

}

exports.modifySendResponse = (res, dbname, fn) => {
    ////// IMPLEMENT THIS ?????? /////
}
