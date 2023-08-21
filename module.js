// MODULE SCRIPT
var glib = require('./glib.js');
var fs = require('fs');
var app = require('./app.js');
// var objects = require('./db.js');
// var dbs     = require('./dbs');


const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal:false
})


////////////////////////////////////////////////////////////
// MODULE API: Resets all databases
////////////////////////////////////////////////////////////

var ENGINE_SQLITE     = "SQLITE3";      // SQLITE database engine selection
var ENGINE_MYSQL      = "MySQL";        // MYSQL database engine selection
var once = false;

exports.called_from_migration_file = false;

///////////////////////////////////////////////////
///// MIGRATION API : Update a field inside the table
///// -- No changes in the schema -- this function will be called only from apply/unapply migration
///////////////////////////////////////////////////
module.exports.update_db_field = async function(dbname, field, callback){
    var self = this;
    app.initialize_only_database = true; /// do NOT initialize the HTTP server ///
    app.startup('').then(err => {
        if(err) { glib.serverlog('Failed to initialize database', 1); process.exit(1); return; }    
        
        /// dbname check 
        if(!(dbname in db)){ glib.serverlog('Database table ' + dbname + ' not found', 1); process.exit(1); return; }
        
        var _db = db[dbname];
        _db.updatecolumn(field).then(() => {
            glib.serverlog('Successfully updated ' + dbname + ' table : ' + field.fname, 0);
            if(callback) callback();
            else process.exit(0);
        }).catch(err => {
            glib.serverlog('Failed to update ' + dbname, 0);
            glib.serverlog(err, 0);
            if(callback) callback(err);
            process.exit(1);
        })
    })
}

///////////////////////////////////////////////////
///// CMD API & MIGRATION API : Adding a field inside the table
///////////////////////////////////////////////////
module.exports.add_db_field = async function(dbname, field, callback){
    if(!dbname) missing_field('"dbname" -----> Table name');
    if(!field.fname) missing_field('"field.fname" -----> Field name');
    if(!field.type) missing_field('"field.type" -----> Field type');

    var self = this;
    app.initialize_only_database = true; //// do not initialize the HTTP server //// 
    app.startup('').then(async (err) => {
        if(err) { glib.serverlog('Failed to initialize database', 0); process.exit(1); return;}
    
        if(!(dbname in db)) { glib.serverlog('Database table ' + dbname + ' not found ', 0); process.exit(1); return;}
        var _db = db[dbname];
        if(field.size && field.size > 1) {
            try{
                // Begin transaction to add all columns for this field
                await db.engine.begin();

                for(let i=0; i<field.size; i++){
                    let temp = JSON.parse(JSON.stringify(field)); // clone field
                    temp.fname = `${field.fname}_${i}`; // e.g "fname": "scores" ---> "temp.fname": "scores_0"
                    await _db.addcolumn(temp);
                }

                // Commit transaction
                await db.engine.commit();

                glib.serverlog('Successfully added ' + field.fname + ' to ' + dbname, 1);
                if(self.called_from_migration_file){
                    if(callback) callback();
                }
                else{
                    self.add_db_field(dbname, field);
                }
            }
            catch(err){
                await db.engine.rollback();

                glib.serverlog('Failed to add column ' + field.fname + ' to ' + dbname , 0);
                if(callback) callback();
                else process.exit(1);
            }
        }
        else {
            _db.addcolumn(field).then( async () => {
                glib.serverlog('Successfully added ' + field.fname + ' to ' + dbname, 1);
                
                // Update all existing records with the default value of the new field //
                var records = await _db.get();
                for(let record of records){
                    record.account_uid = field.def;
                    await _db.update(record);
                }
                
                if(self.called_from_migration_file){
                    if(callback) callback()
                }
                else{
                    self.add_field(dbname, field);
                }
                // process.exit(0);
            }).catch(err => {
                glib.serverlog('Failed to add column ' + field.fname + ' to ' + dbname , 0)
                if(callback) callback(err);
                else process.exit(1);
            })
        }
        
    })

}

//////////////////////////////////////////////////////
//// CMD API & MIGRATION API : Removing a field from table
//////////////////////////////////////////////////////
module.exports.remove_db_field = async function(dbname, field, callback){
    var self = this;
    app.initialize_only_database = true; //// do NOT initialize the HTTP server ////
    app.startup('').then(err => {
        if(err) { glib.serverlog('Failed to initialize database', 0); process.exit(1); return;}
        
        var temp = {fname:field.fname};
        if(!(dbname in db)) { glib.serverlog("Database table " + dbname + ' not found', 0); process.exit(1); return;}

        var _db = db[dbname];
        
        _db.removecolumn(temp).then( () => {
            glib.serverlog('Sucessfully removed ' + field.fname + ' from ' + dbname, 1);
            if(self.called_from_migration_file){
                if(callback) callback();
            }
            else self.remove_field(dbname, field.fname);
        }).catch(err => {
            glib.serverlog('Failed to remove column ----->' + err, 0);
            process.exit(1);
        })
    })
}

///////////////////////////////////////////////////////
//// CMD API       : 'npm run removemodel'
//// MIGRATION API : 'removemodel' opearation
//// RESULT        : 'Remove a table from the database'
///////////////////////////////////////////////////////
var remove_once = false;
module.exports.removemodel = async function(dbname, callback){
    const self = this;
    if(remove_once && !callback) return; // if called from command-line
    glib.serverlog('Removing a database : '+ dbname, 3);
    remove_once = true;
    app.initialize_only_database = true;

    app.startup('').then(err => {
        if(err) { glib.serverlog('Failed to initialize database', 0); process.exit(1);}

        init().then( () => {
            if(callback){
                callback();
                return;
            }
            process.exit(0);
        }).catch(err => {
            if(err) glib.serverlog(err, 0);
            if(callback){
                callback(err);
                return;
            }

            process.exit(1);
        })
    })

    const init = async function(){

        try{
            await remove_model_json(dbname);
        }
        catch(e){};

        try{
            await remove_resource_file(dbname);
        }
        catch(e){};

        try{
            await remove_registered_endpoint(dbname);
        }
        catch(e){}
        
        try{
            await remove_database_table(dbname);
        }
        catch(e){};
        
        try{
            await remove_from_json_schema(dbname);
        }
        catch(e){};
        
        /// remove row from json_schema table ///
    }
}

///////////////////////////////////////////////////////
//// CMD API & MIGRATION API : Adding a table in the database
///////////////////////////////////////////////////////
var once = false;
module.exports.addmodel = async function(dbname, callback, fromMigration){
    const self = this;
    if(once && !callback) return; /// if called from Command-Line ///
    glib.serverlog('Adding a database ' + dbname, 3);
    once = true;
    app.initialize_only_database = true; /// do NOT initialize the HTTP server ///
    app.startup('').then((err) => {
        if(err) { glib.serverlog('Failed to intialize database', 0); process.exit(1); return; }
        init().then( () => {
            if(callback){
                callback();
                return;
            }
            process.exit(0);
        }).catch(err => {
            if(err) glib.serverlog(err, 0);
            if(callback){
                callback(err);
                return;
            }
            process.exit(1);
        })
    });

    const init = async function(){
        await create_resource(dbname);
    
        if(!fromMigration) await update_databases_json(dbname);

        await update_registered_json(dbname);

        await self.insert_database_schema(dbname);

        await create_database_table(dbname);
    }
}

///////////////////////////////////////////////////////
/// HELPER FUNCTION : Creating a resource script
/// ---- Called when a database table is created
///////////////////////////////////////////////////////
var create_resource = function(dbname){
    glib.serverlog('Creating resource .....' , 3);
    let name = dbname + 'Resource';
    let path = './resources/' + name + '.js';

    let script = '';
    
    /// GENERATE A RESOURCE-CLASS SCRIPT FILE ///

    script = '\
    var glib    = require("../glib.js");\n\
    var master  = require("./master.js");\n\
    \n\
    exports.' + name + ' = class extends master.masterResource {\n\
        constructor(){\n\
            super();\n\
            this.' + dbname + ' = db.' + dbname + ';\n\
            super.initialize(this.' + dbname + ');\n\
        }\n\
        \n\
        __authorize__(self){\n\
            // authorization for all requests of ' + dbname + '\n\
            // "self" parameter is an object with two attributes\n\
            // "req" (request object) and "res"(response object)\n\
            return true\n\
        }\n\
    }\n\
    ';


    ////// Find out a work-around with read-line promise fail ////////
    //// then remove the 0==1 condition /////
    //// to prevent auto-overwride the resource file if-exists /////
    //// but to ask for the user what to do /////
    if(0 == 1 && fs.existsSync(path)){
        try{
             return new Promise((resolve,reject) => {
                 readline.question('Resource ' + name + ' already exists. Do you want to overwride it? (Y/N)', async (answer) => {
                    if(answer == 'Y' || answer == 'y'){
                        fs.writeFile(path, script, function(err){
                            resolve();
                        })
                    }
                    else{
                        glib.serverlog('Terminate process');
                        reject();
                    }  
                 })
             })
        }
        catch(err){
            return new Promise((resolve, reject) => {
                reject('Could not get user input');
            })
        }
    }
    else{
        return new Promise((resolve, reject) => {
            fs.writeFile(path, script, function(err){
                if(err) reject(err);
                else resolve();
            })
        })
    }

    

}

////////////////////////////////////////////////////////////
// HELPER FUNCTION : Updates the json_schema database record
//                   By getting the operation given to :
//              a)  remove field -> Get the json schema record / remove the field / push the updated schema on the database
//              b)  add field -> Get the json schema record / add the field / push the updated schema on the database
//              c)  update field -> Get the json schema record / update the field / push the updated schema on the database
// =========================================================

module.exports.update_database_schema = function(operation){
    return new Promise( async (resolve, reject) => {
        let json_schema = await db.json_schema.query(['tablename'],[operation.dbname]);
        let schema = glib.parseModelSchema(json_schema[0].schema)[operation.dbname];

        switch(operation.type){
            case 'add_field':
                schema.fields.push(operation.field);
                break;
            case 'remove_field':
                for(let i=0; i<schema.fields.length; i++){
                    if(schema.fields[i].fname == operation.field.fname) schema.fields.splice(i,1);
                }
                break;
            case 'update_field':
                for(let i=0; i<schema.fields.length; i++){
                    if(schema.fields[i].fname == operation.field.fname){
                        schema.fields[i] = operation.field;
                        i = schema.fields.length; // end loop
                        break;
                    }
                }
                break;
        }

        try{
            let query = 'UPDATE json_schema SET schema=? WHERE tablename="' + operation.dbname + '"';
            out = {};
            out[operation.dbname] = schema;
            await db.engine.customQuery(null,query,[JSON.stringify(out)]); 
            resolve();
        }
        catch(err){
            glib.serverlog('Failed to update JSON_SCHEMA database ::: ' + JSON.stringify(err), 0);
            reject(err);
        }
    })
}

////////////////////////////////////////////////////////////
// HELPER FUNCTION : Insert a record in json_schema database 
// ========================
module.exports.insert_database_schema = function(dbname){
    String.prototype.replaceAt=function(index, replacement) {
        return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
    }

    return new Promise( (resolve, reject) => {
        const filename = './models/' + dbname + '.json';
        glib.readJSONfile(filename).then(async (table) => {
            var data = table;
            try{ data = JSON.stringify(table, null , 4); }
            catch(err) { glib.serverlog(err,0); reject(err); return; }
            data = data.replaceAt(0, "'");
            data = data.replaceAt(data.length-1, "'");
            
            try{
                // ## BEGIN TRANSACTION //
                let begin = "BEGIN TRANSACTION;";
                await db.engine.customQuery(null,begin,[]);

                // ## DELETE OLD json_schema RECORD //
                let remove = 'DELETE FROM json_schema WHERE tablename=?';
                await db.engine.customQuery(null,remove,[dbname]);

                // ## INERT NEW json_schema RECORD -- the .json model file that we got //
                let insert = "INSERT INTO json_schema (tablename,schema) VALUES('" + dbname + "'," + data + ");";
                await db.engine.customQuery(null,insert,[]);

                // ## COMMIT SQL QUERIES //
                let commit = 'COMMIT;';
                await db.engine.customQuery(null, commit,[]);

                resolve();
            }
            catch(err){
                glib.serverlog(err, 0);
                reject(err);
            }
        }).catch(err => {
            glib.serverlog('File ' + filename + ' not found', 0);
            reject(err);
        })
    })
}

////////////////////////////////////////////////////////////
// HELPER FUNCTION : Remove database table
//                   When removing a model
// =========================================================

var remove_database_table = function(dbname){
    return new Promise((resolve, reject) => {
        try{
            let query = 'DROP TABLE ' + dbname;
            
            db.engine.customQuery(null, query, [])
                .then( () => {
                    glib.serverlog('Removed table ' + dbname + ' from database' , 1);
                    resolve();
                })
                .catch(err => {
                    glib.serverlog('Failed to remove table ' + dbname + ' from database' , 0);
                    reject(err);
                })
        }
        catch(err){
            glib.serverlog(err, 0);
            glib.serverlog('Failed to remove table ' + dbname + ' from database', 0);
            reject(err);
        }
    })
}

////////////////////////////////////////////////////////////
// HELPER FUNCTION : Remove record from json_schema table
//                   When removing a model
// =========================================================

var remove_from_json_schema = function(dbname){
    return new Promise((resolve, reject) => {
        try{
            let query = 'DELETE FROM json_schema WHERE tablename="' + dbname + '"';
            db.engine.customQuery(null,query,[])
                .then(() => {
                    glib.serverlog('Removed successfully from json_schema' , 1);
                    resolve();
                })
                .catch(err => {
                    glib.serverlog('Failed to remove from json_schema', 0);
                    reject(err);
                })
        }
        catch(err){
            glib.serverlog(err, 0);
            reject(err);
        }
    })
}


////////////////////////////////////////////////////////////
// HELPER FUNCTION : Remove resource.js file 
//                   When removing a model
// =========================================================

var remove_resource_file = function(dbname){
    return new Promise( (resolve, reject) => {
        try{
            let filename = 'resources/' + dbname + 'Resource.js';
            fs.unlink(filename, (err) => {
                if(err){
                    glib.serverlog('Failed to remove Resource file ::: ' + filename , 0);
                    reject(err);
                    return;
                }
                glib.serverlog('Removed resource file ::: ' + filename,0);
                resolve();
            })
        }
        catch(err){
            glib.serverlog(err, 0);
            reject(err);
        }
    })
}

////////////////////////////////////////////////////////////
// HELPER FUNCTION : Remove a model.json file 
//                   When removing a model
// ==========================================================

var remove_model_json = function(dbname){
    return new Promise( (resolve, reject) => {
        try{
            fs.unlink('./models/' + dbname + '.json', (err) => {
                if(err){
                    glib.serverlog('Failed to remove model JSON file ::: ' + dbname, 0);
                    glib.serverlog(err,0);
                    reject(err);
                }

                glib.serverlog('Removed file :::: ' + dbname,0);
                resolve();
            })
        }
        catch(err){
            glib.serverlog(err,0);
            reject(err);
        }
    })
}

////////////////////////////////////////////////////////////
// HELPER FUNCTION : Remove a registered endpoint from JSON file
//                   When removing a model
// ========================

var remove_registered_endpoint = function(dbname){
    return new Promise( (resolve, reject) => {
        try{
            glib.readJSONfile('./registered.json').then(registered => {
                if(!registered || registered == ''){
                    resolve();
                    return; /// if empty file return
                }

                try{ registered = JSON.parse(registered)}
                catch(err){};

                if(!('registered_endpoints' in registered)){
                    resolve();
                    return; /// if no endpoints in registered.json -- return
                }

                let i=0;
                for(let reg of registered.registered_endpoints){
                    if(reg.dbname == dbname){
                        glib.serverlog('Removing registered endpoint :::: ' + dbname,0);
                        registered.registered_endpoints.splice(i,1);
                    }
                    i++;
                }

                registered = JSON.stringify(registered, null, 4);
                glib.writeJSONfile('./registered.json', registered).then( () => {
                    glib.serverlog('Completed removing registered endpoint :::: ' + dbname,0);
                    resolve();
                }).catch(err => {
                    glib.serverlog('Failed to remove register endpoint :::: '+ dbname,0);
                    glib.serverlog(err,0);
                    reject(err);
                })
            }).catch(err => {
                glib.serverlog('Failed to open JSON file', 0);
                glib.serverlog(err,0);
                reject(err);
            })
        }
        catch(err){
            glib.serverlog(err,0);
            reject(err);
        }
    })
}

////////////////////////////////////////////////////////////
// HELPER FUNCTION : Add a registered endpoint in JSON file when adding a new model
// ========================
var update_registered_json = function(dbname) {
    return new Promise( (resolve, reject) => {
        try{
            glib.readJSONfile('./registered.json').then(registered => {
                if(!registered || registered == '') registered = {};

                let resource = dbname + 'Resource';
                let temp = {
                    dbname:dbname,
                    endpoint:dbname,
                    resource:resource
                }

                try{ registered = JSON.parse(registered)}
                catch(err){};

                if(!('registered_endpoints' in registered)) registered['registered_endpoints'] = [];

                let i = 0;
                for(let reg of registered.registered_endpoints){
                    if(reg.dbname == dbname){
                        glib.serverlog('Overwriding registered endpoint for ' + dbname, 3);
                        registered.registered_endpoints.splice(i,1);
                    }
                    i++;
                }

                registered.registered_endpoints.push(temp);
                registered = JSON.stringify(registered, null ,4);

                glib.writeJSONfile('./registered.json', registered).then(() => {
                    glib.serverlog('Completed adding a registered endpoint', 1);
                    resolve();
                }).catch(err => {
                    glib.serverlog('Failed to register endpoint',0);
                    glib.serverlog(err,0);
                    reject(err);
                })
            }).catch(err => {
                glib.serverlog('Failed to open JSON file',0);
                glib.serverlog(err,0);
                reject(err);
            })
        }
        catch(err){
            glib.serverlog(err,0);
            reject();
        }
    }) 
}

/////////////////////////////////////////////
/// HELPER FUNCTION : Creating a table in the database
////// Reading json model from file -- and append it to db.engine.create 
/////////////////////////////////////////////
var create_database_table = function(dbname){
    return new Promise ( async (resolve, reject) => {
        var filename = './models/' + dbname + '.json';
        glib.readJSONfile(filename).then( database => {
            if(database && database !== '' && typeof(database) == 'object' && dbname in database){
                glib.serverlog('Terminating process cause of failure',0);
                glib.serverlog('Database ' + dbname + ' already exists',0);
                reject();
                return;
            }
            else{
                try{ database = JSON.parse(database)}
                catch(err){}
                var dbf = database[dbname];
                db.engine.create(dbf, function(err){
                    if(err) reject(err);
                    else resolve();
                })
            }
        }).catch(err => {
            reject(err);
        })
    })
}

////////////////////////////////////////////////////////////
// HELPER FUNCTION: Creates (or Updates if already exists) the dbname.json model file
//////////////////////// Called in module.exports.addmodel 
// ========================
var update_databases_json = function(dbname){
    return new Promise( (resolve, reject) => {
        var filename = './models/' + dbname + '.json';
        if(fs.existsSync(filename)){
            glib.readJSONfile(filename).then(databases =>{
                if(databases && databases !== '' && typeof(databases) == 'object' && dbname in databases){
                    glib.serverlog('Terminating process cause of failure',0);
                    glib.serverlog('Database ' + dbname + ' already exists', 0);
                    reject();
                    return;
                }
                else{
                    let resource = dbname + 'Resource';
                    let temp = {
                        name:dbname,
                        vname:dbname,
                        endpoint:dbname,
                        resourceName:resource,
                        inputGroups:[],
                        fields:[
                            {fname:"test" , type:"str", len:160, "def":"", hlp:"Just a test field so table is not empty"}
                        ]
                    }


                    if(databases == '') databases = {};


                    try{
                        databases = JSON.parse(databases);
                    }
                    catch(err){}

                    if(dbname in databases && 'fields' in databases[dbname] && databases[dbname].fields.length > 0){
                        temp['fields'] = databases[dbname].fields;
                    }

                    databases[dbname] = temp;
                    databases = JSON.stringify(databases, null , 4);

                    glib.writeJSONfile(filename, databases).then(() => {
                        glib.serverlog('Completed database model insert.',1);
                        resolve();
                    }).catch(err => {
                        glib.serverlog(err,0);
                        reject();

                    })
                }
            }).catch(err => {
                glib.serverlog(err,0);
                reject();
            })
        }
        else{
            //// new model ////
            let resource = dbname + 'Resource';
            let temp = {
                name:dbname,
                vname:dbname,
                endpoint:dbname,
                resourceName:resource,
                inputGroups:[],
                fields:[
                    {fname:"test" , type:"str", len:160, "def":"", hlp:"Just a test field so table is not empty"}
                ]
            }
            let databases = {}
            databases[dbname] = temp;
            databases = JSON.stringify(databases, null ,4);
            glib.writeJSONfile(filename, databases).then(() => {
                glib.serverlog('Completed database model insert.',1);
                resolve();
            }).catch(err => {
                glib.serverlog(err,0);
                reject();

            })
        }
    })
}


var missing_field = function(field){
    glib.serverlog("Missing field : " + field,0);
    process.exit(1);
}

////////////////////////////////////////////////////////////
// MODULE API : Remove field from schema(database) JSON file.
/// ---- Call 'remove_db_field' to actually remove the field from the database ///
// ========================
module.exports.remove_field = function(dbname, fname){
    var self = this;
    if(!dbname) missing_field('"dbname" ------> Table name');
    if(!fname) missing_field('"fname" -------> Field name');

    let filename = './models/' + dbname + '.json'; /// model JSON file ////

    glib.readJSONfile(filename).then(databases => {
        try{ databases = JSON.parse(databases)}
        catch(err) {}
        if(!databases || databases == '' || typeof(databases) !== 'object' || !(dbname in databases)){
            glib.serverlog('No database ' + dbname + ' found',0);
            process.exit(1);
        }

        let fields = databases[dbname]['fields'];

        let i=0;
        for(let f of fields){
            if(f.fname == fname){
                databases[dbname]['fields'].splice(i,1);
            }
            i++;
        }
        
        databases = JSON.stringify(databases, null ,4)
        glib.writeJSONfile(filename, databases).then( async () => {
            glib.serverlog('Successfully removed ' + fname + ' from ' + dbname,1);
            await self.insert_database_schema(dbname);
            process.exit(0);
        }).catch(err => {
            glib.serverlog('Failed to write in JSON file.',0);
            process.exit(1);
        })
    }).catch( err => {
        glib.serverlog('File + ' + filename + ' not found.',0);
        process.exit(1);
    })
}


////////////////////////////////////////////////////////////
// MODULE API : Import field in schema(database) JSON file.
//// ---- Call 'add_db_field' to also append it in the database ----
// ========================
module.exports.add_field = function(dbname, field){
    let fname = field.fname;
    let type = field.type;
    let len = field.len;
    let def = field.def;
    let size = field.size;
    let hlp  = field.hlp;
    
    var self = this;
    glib.serverlog('Adding field to model',3);

    if(!len) len = 160;
    if(!def){
        switch(type){
            case 'amt': case 'i32' :
                def = 0;
                break;
            case 'f':
                def = -1;
                break;
            case 'str':
                def = '';
                break;
        }
    }
    else{
        if(type == 'i32' || type == 'f') def = parseInt(def);
        else if(type == 'amt') def = parseFloat(def);
    }
    
    let filename = './models/' + dbname + '.json'; /// model JSON file ////

    // glib.readJSONfile(filenname).then(databases => {
    glib.readJSONfile(filename).then(databases => {
        try{ databases = JSON.parse(databases)}
        catch(err) {}
        if(!databases || databases == '' || typeof(databases) !== 'object' || !(dbname in databases)){
            glib.serverlog('No database ' + dbname + ' found',0);
            process.exit(1);
        }

        let fields = databases[dbname]['fields'];
        if(!fields) fields = [];

        for(let f of fields){
            if(f.fname == fname){
                glib.serverlog('Field ' + fname + ' already exists in ' + dbname,0);
                process.exit(1);
            }
        }

        let temp = {
            fname:fname,
            type:type,
            len:parseInt(len),
            def:def,
        }
        if(size) temp['size'] = size;
        if(hlp) temp['hlp'] = hlp;

        fields.push(temp);

        databases = JSON.stringify(databases, null, 4);
        
        // glib.writeJSONfile(filenname, databases).then(() => {
        glib.writeJSONfile(filename,databases).then( async () => {
            glib.serverlog('Successfully added field ' + fname,1);
            await self.insert_database_schema(dbname);
            process.exit(0);
        }).catch(err => {
            glib.serverlog('Failed to add ' + fname + ' in ' +dbname,0);
            glib.serverlog(err,0);
            process.exit(1);
        })
    }).catch(err => {
        glib.serverlog('File ' + filename + ' not found',0);
        process.exit(1);
    })
}