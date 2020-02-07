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

const modify_object_methods = [
    'PUT',
    'PATCH',
    'DELETE'
]

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

    
    // =======================================
    // == ENDPOINT AUTHORIZATION CHECK 
    // ========================================

    var auth_classes = app.settings.AUTHORIZATION_CLASS;
    var META_ATTRIBUTES = db.Meta;

    if('Meta' in db && 'AUTHORIZATION_CLASS' in db['Meta']){
        auth_classes = db['Meta'].AUTHORIZATION_CLASS;
    }
    
    if(Array.isArray(auth_classes)){
        try{
            for(let auth_class_name of auth_classes){
                if(auth_class_name && auth_class_name in handler.auth && auth_class_name !== 'none'){
                    var authorized_user;
                    
                    var __authorization__ = handler.auth[auth_class_name];
                    if(modify_object_methods.includes(method)){
                        /// if the request method is to manipulate an existing object
                        /// check if modify_object function exists in authorization class
                        /// to check for access to modify specific object 
                        if('modify_object' in __authorization__){
                            if(kwargs && 'rowid' in kwargs && kwargs.rowid > -1){
                                let __obj__ = await objects.databases[dbname].get(kwargs.rowid);
                                
                                let has_access_to_this_object = __authorization__.modify_object(parameters, __obj__[0]);
                                if(!has_access_to_this_object){
                                    db.__authorization_failed__(self,'No access to modify this object')
                                    return;
                                }
                            }
                        }
                    }
        
                    if('authorize' in __authorization__ && typeof(__authorization__.authorize) == 'function'){
                        /// if safe methods exists in the meta attribute -- include them in authorization check ///
                        if(META_ATTRIBUTES && 'SAFE_AUTH_METHODS' in META_ATTRIBUTES){
                            authorized_user = await handler.auth[auth_class_name].authorize(parameters,method,META_ATTRIBUTES.SAFE_AUTH_METHODS);
                        }
                        else {
                            authorized_user = await handler.auth[auth_class_name].authorize(parameters,method);
                        }
                    }
                }
            }
        }
        catch(err){
            console.log('Authorization failed');
            db.__authorization_failed__(self,err);
            return;
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
