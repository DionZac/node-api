var main = require('./module.js');
var app  = require('./app.js');
var glib = require('./glib.js');
// var dbs  = require('./dbs.js');
var fs   = require('fs');

const colors = require('colors');


var migration_error = function(err){
    glib.serverlog("Migration error : -> " + JSON.stringify(err),0);
    process.exit(1);
}

///////////////////////////////////////////////////////
// HELPER FUNCTION : 'unapply_migration'
// ---- called by runmigrations npm script 
// ---- when migrate back to specific migration number
// ---- Gets a migration object and unapply it's function
///////////////////////////////////////////////////////
function undo_migration(migration){
     
}


///////////////////////////////////////////////////////
// CMD API : Checking database(model.json) and databases schema(from schema_json table) and creates migration files if needed
///////////////////////////////////////////////////////
module.exports.createmigrations = function(){
    var settings = app.settings;
    var self = this;
    
    app.initialize_only_database = true; /// do not initialize HTTP server
    app.startup('').then(err => {
        var migrations = [];

    glib.loadModelFiles().then( dbfiles =>{
        let query = "SELECT * FROM json_schema;";
        db.engine.customQuery(null, query, []).then(rows => {
            for(let dbfile in dbfiles){
                let database = dbfiles[dbfile];
                try{ database = JSON.parse(database)}
                catch(err) {}

                for(let dbname in database){
                    if(dbname == 'json_schema' || dbname == 'migrations') continue;

                    var exists = false;

                    for(let row of rows){
                        if(row.tablename == dbname){
                            exists = true;
                            
                            
                            try{
                                var schema = row.schema;
                                
                                // schema = schema.replace(/\s+/g,"");
                                schema = schema.replace(/\\n/g, "");
                                schema = schema.replace(/\\r/g, "");
                                schema = schema.replace(/\\/g, "");

                                
                                schema=JSON.parse(schema);
                            }
                            catch(err){glib.serverlog(err,0); var schema = row.schema}
                            
                            for(let schema_name in schema){
                                if(schema_name == dbname){
                                    var s = schema[schema_name];
                                    
                                    let schema_fields = s.fields;
                                    let json_fields   = database[dbname].fields;
                                    
                                    //// check for removed fields ////
                                    //// if any field exists in database but not in the model 
                                    //// migration will be remove_field ////
                                    for(let schema_field of schema_fields){
                                        var field_exist = false;
                                        for(let json_field of json_fields){
                                            if(json_field.fname == schema_field.fname) field_exist = true;
                                        }
                                        if(!field_exist){
                                            migrations.push({ type:'remove_field', dbname:dbname, field:schema_field});
                                        }
                                    }

                                    for(let json_field of json_fields){
                                        var field_exist = false;
                                        for(let schema_field of schema_fields){
                                            if(schema_field.fname == json_field.fname){
                                                //// found the field
                                                field_exist = true;
                                                let diff = Object.keys(schema_field).filter(k => schema_field[k] !== json_field[k]);
                                                for(let i=0; i<diff.length; i++){
                                                    if(diff[i] == 'def') diff.splice(i,1);
                                                }
                                                
                                                if(diff.length > 0){
                                                    migrations.push({type:'update_field', dbname:dbname, field:json_field});
                                                }
                                            }
                                        }

                                        if(!field_exist){
                                            migrations.push({type:'add_field', dbname:dbname, field:json_field});
                                        }
                                    }
                                }
                            }

                        }
                    }
                    if(!exists){
                        migrations.push({type:'add_database' , dbname:dbname})
                    }
                }
            }
            self.create_migration_files(migrations)

        })
        .catch(err => {
            glib.serverlog('Failed to load the JSON schema database.',0);
            glib.serverlog('Error -> ' + JSON.stringify(err),0); 
            process.exit(1);
        })
    }).catch(err => {
        glib.serverlog('Failed to load tables json files ' + JSON.stringify(err),0);
        process.exit(1);
    })
    })

}

///////////////////////////////////////////////////////
// CREATE MIGRATIONS HELPER FUNCTION 
// 
// input  =====> List of migration operations objects
// result =====> Creates a migration Script file in the migrations folder.
//               Operations array of the Script will be the list of the objects given.
////////////////////////////////////////////////////////

module.exports.create_migration_files = async function(list){
    if(list.length == 0){ glib.serverlog('No changes in the models. \n0 Migrations created'.red); process.exit(0);}

    let script = '';
    //// GENERATE SCRIPT FOR MIGRATION FILE /////
    let migration_name = await generate_migration_name(list);
    
    script = '\
    exports.migration = {\n\
        operations:[\n\ ';

    list.forEach(migration => {
        if(!('type' in migration)){
            glib.serverlog('No migration type found',0);
            return;
        }

        if(!('dbname' in migration)){
            glib.serverlog('No migration dbname found',0);
            return;
        }

        
        script += JSON.stringify(migration,null , 4);
        script += ',';
    });


    script += ']';
    script += '}';
    
    try{
        let path = './migrations/' + migration_name + '.js';
        fs.writeFile(path, script, function(err){
            if(err) glib.serverlog(err,0)
            process.exit(0);
        })
    }
    catch(err){ glib.serverlog('Error -> ' + JSON.stringify(err),0);}
}


///////////////////////////////////////////////////////
// CMD API : Migrations --- > Running available migrations
///////////////////////////////////////////////////////

var once = false;
module.exports.runmigrations = function(MIGRATION_NUMBER){
    if(once) return;

    let unapply = false;
    if(MIGRATION_NUMBER) unapply = true;

    once = true;
    /// MIGRATION NUMBER VARIABLE WILL BE USED TO MIGRATE IN SPECIFIC MIGRATION ///
    try{
        app.initialize_only_database = true; /// do NOT initialize the HTTP web server
        app.startup('').then(err => {
            /// Get the migration already applied ////
            let out = 'SELECT rowid,* FROM migrations;';
            db.engine.customQuery(null, out, []).then(async (rows) => {
                var migrations = [];
                migrations = await glib.loadMigrationFiles();

                var migrations_applied = rows;
                var at_least_one_migration = false;

                var last_migration_applied = -1;
                if(rows && rows.length > 0){
                    last_migration_applied = parseInt(rows[rows.length-1].number);
                }

                for(let migration of migrations){
                    let num = migration.split('_')[0];
                    
                    if(MIGRATION_NUMBER && MIGRATION_NUMBER<last_migration_applied && MIGRATION_NUMBER < num) unapply = true;
                    else unapply = false;

                    let exists = false;
                    for(let applied of migrations_applied){
                        if(applied.number == num) exists = true;
                    }


                    //// if unapply check the migration number given ////
                    if(!unapply && !exists){
                        
                        /// extra check if given number to apply a migration instead of running all available migrations ///
                        if(MIGRATION_NUMBER && MIGRATION_NUMBER < num) continue;

                        at_least_one_migration = true;
                        /// run this migration ////

                        try{
                            await run_migration(migration,false);
                            await add_migration_record(migration);
                        }
                        catch(err){
                            glib.serverlog('Failed to apply migration ::: '+ num,0);
                        }
                    }
                    else if(unapply){
                        at_least_one_migration = true;
                        glib.serverlog('Unaply migration ' + num,2);
                        try{
                            await run_migration(migration, unapply);
                            await remove_migration_record(migration);

                            /// change the last applied to properly manage the 'unapply' variable ///
                            last_migration_applied = parseInt(migration);
                        }
                        catch(err){
                            glib.serverlog('Failed to unapply migration ::: ' + num, 0);
                        }
                    }
                }

                if(!at_least_one_migration) glib.serverlog('No migrations to apply.',3);

                process.exit(0);
            })
            .catch(err => {
                migration_error(err);
            })
        })
    }
    catch(err){
        glib.serverlog('Migration run failed -> ',0);
        glib.serverlog(err,0);
    }

}

///////////////////////////////////////////////////////
// HELPER FUNCTION : 'run_migration'
// ---- called by runmigrations npm script
// 
// Input  ====> Migration object
//        ====> "unapply" : Boolean variable if this migrations has to be unapplied instead
// Output ====> Runs the migration object operation
//              Helper Functions:  'addmodel' / 'addfield' / 'updatefield' / 'removefield' 
//                    
///////////////////////////////////////////////////////

function run_migration(migration,unapply){
    return new Promise( async (resolve, reject) => {
        glib.serverlog('Running migration ' + migration,2);
        /// update the schema on the database ///
        /// update the database ////
        var file = require('./migrations/' + migration);
        var operations = file.migration.operations;
        if(operations.length == 0) {
            glib.serverlog('Empty migration file',0);
            resolve();
            return;
        }

        try{
            for(let op of operations){
                if(unapply){
                    if(op.type == 'add_database') op.type = 'remove_database';
                    else if(op.type == 'remove_database') op.type = 'add_database';
                    else if(op.type == 'add_field') op.type = 'remove_field';
                    else if(op.type == 'remove_field') op.type = 'add_field';
                    else if(op.type == 'update_field'){
                        /// undo the update_field operation ///
                    }
                }
                glib.serverlog('Running operation : ' + op.type + ' ' +  op.dbname, 3);
                switch(op.type){
                    case 'add_database':
                        if(!('dbname' in op)){
                            glib.serverlog('No dbname in add database migration at file : ' + migration,0);
                            continue;
                        }
                        main.called_from_migration_file = true;
                        await addmodel(op.dbname);
                        break;
                    case 'remove_database':
                        if(!('dbname' in op)){
                            glib.serverlog('No dbname in remove database migration at file : ' + migration,0);
                            continue;
                        }
                        main.called_from_migration_file = true;
                        await removemodel(op.dbname);
                        break;
                    case 'remove_field':
                        if(!('dbname' in op)){
                            glib.serverlog('No dbname in remove field at file : ' + migration,0);
                            continue;
                        }
                        if(!('field' in op)){
                            glib.serverlog('No fname in remove field at file : ' + migration,0);
                            continue;
                        }
    
                        main.called_from_migration_file = true;
                        await removefield(op);
                        // await main.insert_database_schema(op.dbname);
                        await main.update_database_schema(op);
                        break;
                    case 'add_field':
                        if(!('dbname' in op)){
                            glib.serverlog('No dbname in add field at file : ' + migration,0);
                            continue;
                        }
                        if(!('field' in op)){
                            glib.serverlog('No field in add field at file : ' + migration,0);
                            continue;
                        }
                        main.called_from_migration_file = true;
                        await addfield(op);
                        // await main.insert_database_schema(op.dbname);
                        await main.update_database_schema(op);
                        break;
                    case 'update_field':
                        if(!('dbname' in op)){
                            glib.serverlog('No dbname in remove field at file : ' + migration,0);
                            continue;
                        }
                        if(!('field' in op)){
                            glib.serverlog('No fname in remove field at file : ' + migration,0);
                            continue;
                        }
                        //// just update the database cause the changes will come ONLY from schema ////
                        main.called_from_migration_file = true;
                        await updatefield(op);
                        // await main.insert_database_schema(op.dbname);
                        await main.update_database_schema(op);
                        break;
                    default:
                        glib.serverlog('Unknown type of migration in : ' + migration,0);
                        continue;
                }
            }
            resolve();
        }
        catch(err){
            reject(err);
        }
    })
}

///////////////////////////////////////////////////////
// HELPER FUNCTION : 'removemodel'
// ---- called by run_migration/unapply_migration
// ---- removes a model.
///////////////////////////////////////////////////////

function removemodel(dbname){
    return new Promise((resolve,reject) => {
        try{
            main.removemodel(dbname, (err) => {
                if(err) reject(err);
                else resolve();
            })
        }
        catch(err){
            reject(err);
        }
    })
}

///////////////////////////////////////////////////////
// HELPER FUNCTION : 'addmodel'
// ---- called by run_migration/unapply_migration
// ---- creates a new model.
///////////////////////////////////////////////////////

function addmodel(dbname){
    return new Promise((resolve ,reject) => {
        try{
            main.addmodel(dbname, function(err){
                if(err) { reject(err); }
                else resolve();
            },true);
        }
        catch(err){
            reject(err);
        }
    })
}

///////////////////////////////////////////////////////
// HELPER FUNCTION : 'addfield'
// ---- called by run_migration/unapply_migration
// ---- creates a new field in a model.
///////////////////////////////////////////////////////

function addfield(operation){
    return new Promise( async ( resolve , reject) => {
        try{
            main.add_db_field(operation.dbname, operation.field, function(err){
                if(err) { reject(err);}
                else resolve();
            });
        }
        catch(err){
            reject(err);
        }
    })
}


///////////////////////////////////////////////////////
// HELPER FUNCTION : 'updatefield'
// ---- called by run_migration/unapply_migration
// ---- updates a field in a model.
///////////////////////////////////////////////////////

function updatefield(operation){
    return new Promise( (resolve, reject) => {
        try{
            main.update_db_field(operation.dbname, operation.field, function(err){
                if(err) { reject(err); }
                else resolve();
            })
        }
        catch(err){
            reject(err);
        }
    })
}

///////////////////////////////////////////////////////
// HELPER FUNCTION : 'removefield'
// ---- called by run_migration/unapply_migration
// ---- removes a field from a model.
///////////////////////////////////////////////////////

function removefield(operation){
    return new Promise( (resolve, reject) => {
        try{
            main.remove_db_field(operation.dbname, operation.field, function(err){
                if(err) reject(err);
                else resolve()
            })
        }
        catch(err){ reject(err);}
    })
}

///////////////////////////////////////////////////////
// HELPER FUNCTION : 'remove_migration_record'
// ---- called by runmigrations npm script
//
// ---- removes a new record from the MIGRATIONS database table
// ---- when a migration is unapplied successfully
///////////////////////////////////////////////////////

function remove_migration_record(migration){
    return new Promise( (resolve, reject) => {
        let number = migration.split('_')[0];

        let query = 'DELETE FROM migrations WHERE number="' + number + '"';
        db.engine.customQuery(null,query,[])
            .then(resolve)
            .catch( (err) => {
                glib.serverlog('Remove migration record error ::: ' + JSON.stringify(err), 0);
                reject(err);
            })
    })
}



///////////////////////////////////////////////////////
// HELPER FUNCTION : 'add_migration_record'
// ---- called by runmigrations npm script
//
// ---- creates a new record in the MIGRATIONS database table
// ---- when a migration is applied successfully
///////////////////////////////////////////////////////

function add_migration_record(migration){
    return new Promise( (resolve , reject) => {
        let number = migration.split('_')[0];

        let out = 'INSERT INTO migrations(name,number) VALUES("' + migration + '","' + number + '")';
        db.engine.customQuery(null, out , [])
            .then(resolve)
            .catch(err => {
                glib.serverlog('Insert migration error ::: ' + JSON.stringify(err),0);
                reject(err);
            })
    })
}


///////////////////////////////////////////////////////
// HELPER FUNCTION 'generate_migration_name'
// 
// ----- Generates the migration file name
///////////////////////////////////////////////////////
var generate_migration_name = async function(list){
    return new Promise( async (resolve, reject) => {
        var migrations = await glib.loadMigrationFiles();
        let name;
        if(migrations.length < 9){
            name = '000' + (migrations.length + 1);
        }
        else if (migrations.length < 99){
            name = '00' + (migrations.length + 1);
        }
        else if (migrations.length < 999){
            name = '0' + (migrations.length + 1);
        }
        else name = (migrations.length + 1);
        
        name += '_' + list[0].type + '_';
        if('field' in list[0]) name += list[0].field.fname;
        else name += list[0].dbname;

        glib.serverlog('Generate migration name : ' + name, 3);
        resolve(name);
    })
}


