var main = require('./module.js');
var app  = require('./app.js');
var glib = require('./glib.js');
var dbs  = require('./dbs.js');
var fs   = require('fs');



var migration_error = function(err){
    console.log("Migration error : -> " , err);
    process.exit(1);
}

///////////////////////////////////////////////////
//// MIGRATION API : Applying a migration file.
///////////////////////////////////////////////////
function run_migration(migration){
    var addmodel = function(dbname){
        return new Promise((resolve ,reject) => {
            try{
                main.addmodel(dbname, function(err){
                    if(err) { reject(err); }
                    else resolve();
                });
            }
            catch(err){
                reject(err);
            }
        })
    }

    var addfield = function(operation){
        console.log(operation);
        return new Promise( async ( resolve , reject) => {
            try{
                main.add_db_field(operation.dbname, operation.field.fname, operation.field.type, operation.field.len, operation.field.def, function(err){
                    if(err) { reject(err);}
                    else resolve();
                });
            }
            catch(err){
                reject(err);
            }
        })
    }

    var updatefield = function(operation){
        return new Promise( (resolve, reject) => {
            try{
                main.update_db_field(operation.dbname, operation.field.fname, function(err){
                    if(err) { reject(err); }
                    else resolve();
                })
            }
            catch(err){
                reject(err);
            }
        })
    }

    var removefield = function(operation){
        return new Promise( (resolve, reject) => {
            try{
                main.remove_db_field(operation.dbname, operation.field.fname, function(err){
                    if(err) reject(err);
                    else resolve()
                })
            }
            catch(err){ reject(err);}
        })
    }

    return new Promise( async (resolve, reject) => {
        console.log('Running migration ' + migration);
        /// update the schema on the database ///
        /// update the database ////
        var file = require('./migrations/' + migration);
        var operations = file.migration.operations;
        if(operations.length == 0) {
            console.log('Empty migration file');
            resolve();
            return;
        }

        for(let op of operations){
            console.log('Running operation : ' + op.type + ' ' +  op.dbname);
            switch(op.type){
                case 'add_database':
                    if(!('dbname' in op)){
                        console.log('No dbname in add database migration at file : ' + migration);
                        continue;
                    }
                    main.called_from_migration_file = true;
                    await addmodel(op.dbname);
                    break;
                case 'remove_field':
                    if(!('dbname' in op)){
                        console.log('No dbname in remove field at file : ' + migration);
                        continue;
                    }
                    if(!('field' in op)){
                        console.log('No fname in remove field at file : ' + migration);
                        continue;
                    }

                    main.called_from_migration_file = true;
                    await removefield(op);
                    await main.insert_database_schema(op.dbname);
                    break;
                case 'add_field':
                    if(!('dbname' in op)){
                        console.log('No dbname in add field at file : ' + migration);
                        continue;
                    }
                    if(!('field' in op)){
                        console.log('No field in add field at file : ' + migration);
                        continue;
                    }
                    main.called_from_migration_file = true;
                    await addfield(op);
                    await main.insert_database_schema(op.dbname);
                    break;
                case 'update_field':
                    if(!('dbname' in op)){
                        console.log('No dbname in remove field at file : ' + migration);
                        continue;
                    }
                    if(!('field' in op)){
                        console.log('No fname in remove field at file : ' + migration);
                        continue;
                    }
                    //// just update the database cause the changes will come ONLY from schema ////
                    main.called_from_migration_file = true;
                    await updatefield(op);
                    await main.insert_database_schema(op.dbname);
                    break;
                default:
                    console.log('Unknown type of migration in : ' + migration);
                    continue;
            }
        }
        resolve();
    })
}

function add_migration_record(migration){
    return new Promise( (resolve , reject) => {
        let number = migration.split('_')[0];

        let out = 'INSERT INTO migrations(name,number) VALUES("' + migration + '","' + number + '")';
        dbs.customQuery(dbs.dbdefs.migrations, out , [] , (err) => {
            if(err) { console.log('Insert migration error ::: ' , err); reject(err); return; }
            resolve();
        }) 
    })
}

///////////////////////////////////////////////////////
// CMD API : Migrations --- > Running available migrations
///////////////////////////////////////////////////////
var once = false;
module.exports.runmigrations = function(MIGRATION_NUMBER){
    if(once) return;
    once = true;
    /// MIGRATION NUMBER VARIABLE WILL BE USED TO MIGRATE IN SPECIFIC MIGRATION ///
    try{
        app.initialize_only_database = true; /// do NOT initialize the HTTP web server
        app.startup('', () => {
            let out = 'SELECT rowid,* FROM migrations;';
            dbs.customQuery(dbs.dbdefs.migrations, out, [], async (err,rows) => {
                if(err) migration_error(err);

                var migrations = [];
                migrations = await glib.loadMigrationFiles();

                var migrations_applied = rows;
                var at_least_one_migration = false;

                for(let migration of migrations){
                    let num = migration.split('_')[0];
                    let exists = false;
                    for(let applied of migrations_applied){
                        if(applied.number == num) exists = true;
                    }

                    if(!exists){
                        at_least_one_migration = true;
                        /// run this migration ////
                        await run_migration(migration);
                        await add_migration_record(migration);
                    }
                }

                if(!at_least_one_migration) console.log('No migrations to apply.');

                process.exit(0);
            })
        })
    }
    catch(err){
        console.log('Migration run failed -> ');
        console.log('Reason ::: ', err);
    }

}

///////////////////////////////////////////////////////
// CMD API : Migrations ---- > Creating migration file 
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

        console.log('Name : ' , name);
        resolve(name);
    })
}
module.exports.create_migration_files = async function(list){
    console.log('Creating migrations files...');
    if(list.length == 0){ console.log('No changes in the models. \n 0 Migrations created'.red); process.exit(0);}

    let script = '';
    //// GENERATE SCRIPT FOR MIGRATION FILE /////
    let migration_name = await generate_migration_name(list);
    
    script = '\
    exports.migration = {\n\
        operations:[\n\ ';

    list.forEach(migration => {
        if(!('type' in migration)){
            console.log('No migration type found');
            return;
        }

        if(!('dbname' in migration)){
            console.log('No migration dbname found');
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
            if(err) console.log(err)
            process.exit(0);
        })
    }
    catch(err){ console.log('Error -> ' , err);}
}

//////////////////////////////////////////////////////////////
// CMD API : Checking database(model.json) and databases schema(from schema_json table) and creates migration files if needed
// ========================
module.exports.createmigrations = function(){
    var settings = app.settings;
    var self = this;
    
    app.initialize_only_database = true; /// do not initialize HTTP server
    app.startup('', function(){
        var migrations = [];

    glib.loadModelFiles().then( dbfiles =>{
        let query = "SELECT * FROM json_schema;";
        dbs.customQuery(dbs.dbdefs.json_schema, query, [], (err,rows) => {
            if(err) { console.log('Error -> ' ,err); process.exit(1);}
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
                            catch(err){console.log(err); var schema = row.schema}
                            
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
                                                if(diff.length > 0){
                                                    console.log('DIFFERENCE -> ' , diff);
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
            console.log('migrations -> ' , migrations);
            self.create_migration_files(migrations)

        })
    }).catch(err => {
        console.log('Failed to load tables json files ' , err);
        process.exit(1);
    })
    })

}