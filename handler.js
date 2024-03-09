var glib    = require('./glib.js');
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

exports.initialize_resources = async() => {
    var registered = await glib.readJSONfile('./registered.json');

    registered = JSON.parse(registered);
    if('registered_endpoints' in registered){
        var endpoints = registered.registered_endpoints;
        for(let end of endpoints){
            if(end.endpoint == "migrations") continue;

            if('resource' in end){
                if(!handler[end.resource]){

                    if(!(end.resource in resources)){
                        glib.serverlog('Missing ' + end.resource + ' file on resources folder', 0);
                        continue;
                    }

                    if(!(end.resource in resources[end.resource])){
                        glib.serverlog('Missing ' + end.resource + ' class in resource class file', 0);
                        continue;
                    }

                    var r = new resources[end.resource][end.resource]();
                    handler[end.dbname] = r;
                }
            }
        }
    }

    glib.serverlog("Resource classes are initialized",1)
}

// ===========================
// == INITIALIZE THE AUTHORIZATION CLASSES
// == AND STORE THEM GLOBALLY
// ===========================
exports.initializeAuthorizationClasses = async (req,res) => {
    var auth_classes = await glib.readJSONfile('./authorization.json');
    auth_classes = JSON.parse(auth_classes);

    let AUTH_CLASSES = auth_classes['authorization_classes'];
    for(let obj of AUTH_CLASSES){
        /// initialize the auth class and store in the 'handler' object ///
        handler.auth[obj.name] = new __auth__[obj.classname]();
    }

    glib.serverlog('Authorization classes are initialized', 1);
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
    glib.serverlog("URL map -> " + JSON.stringify(map), 2);

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
    if(!db[dbname]) { throw new Error("Resource " + dbname + "  model missing"); }

    var dbmodel = db[dbname].model;

    var resourceName = dbmodel.resourceName;

    if(!handler[dbname]) {

        if(!(resourceName in resources)){
            glib.serverlog('Missing ' + resourceName + ' file on resources folder.', 0);
            self.res.send('Failed');
            return;
        }

        if(!(resourceName in resources[resourceName])){
            glib.serverlog('Missing ' + resourceName + ' class in resource class file.', 0);
            self.res.send('Failed');
            return;
        }
        var resource = new resources[resourceName][resourceName]();
        handler[dbname] = resource;
    }
    else{
        var resource = handler[dbname];
    }

    /// Check if request Method is allowed on this endpoint ////
    try{
        method = method.toUpperCase();
        let allowed_methods = resource['Meta'].allowed_methods;
        if(!allowed_methods.includes(method)){
            glib.serverlog("Not allowed method", 0);
            throw '';
        }
    }
    catch(err){
        let msg = 'Not allowed request method';
        resource.__handle_not_allowed_method__(self.res,msg);
        return;
    }

    
    // =======================================
    // == ENDPOINT AUTHORIZATION CHECK 
    // ========================================

    var auth_classes = app.settings.AUTHORIZATION_CLASS;
    var META_ATTRIBUTES = resource.Meta;

    if('Meta' in resource && 'AUTHORIZATION_CLASS' in resource['Meta']){
        auth_classes = resource['Meta'].AUTHORIZATION_CLASS;
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
                                let __obj__ = await db[dbname].get(kwargs.rowid);
                                
                                let has_access_to_this_object = __authorization__.modify_object(parameters, __obj__[0]);
                                if(!has_access_to_this_object){
                                    resource.__authorization_failed__(self,'No access to modify this object')
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
            glib.serverlog('Authorization failed', 0);
            resource.__authorization_failed__(self,err);
            return;
        }
    }

    


    try{
        //// if failed to find the database reference given /////
        // if(resource.__handle_reference_error__(res)) return;

        if(fn == '__update__' || fn == '__remove__'){
            /// check if the rowid given is valid ///
            if(!resource.__check_rowid__(self.res,kwargs)) return;
        }

        /// deserialize data for client ///
        if(fn == '__get__'){
            let data;
            if('filter_by' in parameters && 'filter_by' in resource){
                // Resource must include "filter_by" function to make this work //
                data = await resource.filter_by(self, parameters, kwargs);
            }
            else data = await resource[fn](self,parameters,kwargs);

            if(data){
                // Modify the data //
                data = handler.exclude_private_fields(resource, data);
                data = await handler.deserializeData(data,dbname);
                self.res.send(data);
                return;
            }
            else{
                glib.serverlog(`You need to RETURN data in __get__ function of resource ${dbname}`, 0);
                return;
            }
        }

        /// serialize data for database ///
        if(fn == '__update__' || fn == '__insert__'){
            parameters = await handler.serializeData(parameters,dbname);
        }


        resource[fn](self, parameters, kwargs);
    }
    catch(err){
        resource.__function_not_found__(self.res);
        throw new Error(err);
    }
}

exports.serializeData = async function(data,dbname){
    let resource = handler[dbname];
    let fields = db[dbname].model.fields

    for(let f of fields){
        // if(!(f.fname in data)) continue;
        let serialize_function_name = 'serialize_' + f.fname;
        if(serialize_function_name in resource){
            try{
                data[f.fname] = resource[serialize_function_name](data[f.fname]);
            }
            catch(err){}
        }
    }

    if('serialize' in resource){
        try{
            data = await resource.serialize(data);
        }
        catch(e){};
    }

    return data;
}

exports.deserializeData =  function(data, dbname){
    return new Promise( async (resolve,  reject) => {
        let resource = handler[dbname];
        let fields = db[dbname].model.fields;

        let i = 0;
        for(let entry of data){
            for(let f of fields){
                // If table field is array - deserialize the data properly //
                if(f.size && f.size > 1){
                    entry = this.deserialize_array_field_data(entry,f);
                }

                if(!(f.fname in entry)) continue;
                let deserialize_function_name = 'deserialize_' + f.fname;
                if(deserialize_function_name in resource){
                    try{
                        entry[f.fname] = await resource[deserialize_function_name](entry[f.fname]);
                    }
                    catch(err){
                    }
                }
            }

            if('deserialize' in resource){
                try{
                    entry = await resource.deserialize(entry);
                }
                catch(e){};
            }

            data[i] = entry
            i++;
        }

        resolve(data);
    })

}

exports.deserialize_array_field_data = (data, field) => {
    data[field.fname] = [];
    for(let i=0; i<field.size; i++){
        let name = field.fname + '_' + i;
        data[field.fname].push(data[name]);
        delete data[name];
    }

    return data;
}

/**
 * 
 * @param {*} resource : Model Resource Instance
 * @param {*} data : Data after database query
 */
exports.exclude_private_fields = (resource, data) => {
    if(resource.private_fields && Array.isArray(resource.private_fields)){
        for(let pf of resource.private_fields){
            for(let rec of data){
                if(pf in rec) delete rec[pf];
            }
        }
    }

    return data;
}

exports.modifySendResponse = (res, dbname, fn) => {
    ////// IMPLEMENT THIS ?????? /////
}
