// MODULE SCRIPT
var glib = require('./glib.js');
var fs = require('fs');
var es = require('event-stream');
var app = require('./app.js');
var objects = require('./db.js');
var dbs     = require('./dbs');
var request = require('request');


//// query all movies and get a list of all unique 'Genres'
exports.getAllGenres = function(){
    app.initialize_only_database = true;
    app.startup('', async () => {
        let movies = objects.databases.movies;
        let records = await movies.get();
        
        let genres = [];
    // console.log(records[0]);
        for(let rec of records){
            if(!('genres' in rec) || rec.genres == '') continue;

            rec.genres = rec.genres.split('|');

            if(Array.isArray(rec['genres']) && rec['genres'].length > 0){
                for(let movie_genre of rec.genres){
                    let exist = false;
                    for(let genre of genres) if(genre == movie_genre) exist = true;
                    if(!exist) genres.push(movie_genre);
                }
               
            }
        }

        console.log(genres);
    })
}

//// updates the movies images with image links
exports.update_images =  function(){
    /// Start from the first not-updated movie image ///
    let last_movie_image_updated = 2532;

    app.initialize_only_database = true;
    app.startup('', async () => {
        let db = objects.databases.movies;
        let movies = await db.get();
        let idx = 0
        for(let movie of movies){
            idx ++;
            let link = movie['movie_imdb_link'];
            if(idx < last_movie_image_updated || link.indexOf('http') !== 0) continue;
            let image = await getImage(movie.movie_imdb_link);
            movie.movie_imdb_link = image;
            try{
                await db.update(movie);
            }
            catch(err){};
        }
    })
}

/// navigate to the IMDB page of this movie virtually
/// and get the URL of the image
var getImage = function(url){
    return new Promise( (resolve, reject) => {
        // let url = 'http://www.imdb.com/title/tt0401729/?ref_=fn_tt_tt_1';
        console.log(url);
        request.get(url, (err,res) => {
            // console.log('Error -> ' , err);
            let html = res.body;
            var jsdom   = require('jsdom');
            const { JSDOM } = jsdom;
            const { window } = new JSDOM();
            const { document } = (new JSDOM(html)).window;
            global.document = window;
            var $ = jQuery = require('jquery')(window);

            let image = jQuery(html).find('.poster').find('img').attr('src');

            resolve(image);
        })
    })
}

exports.load = function(){
    var totalLines = 0;
    
    var columns = [];
    app.initialize_only_database = true;
    app.startup('', () => {
        var s = fs.createReadStream('./movie_metadata.csv')
        .pipe(es.split())
        .pipe(es.mapSync(async (line) => {
            if(totalLines == 0) {
                // console.log(line);
                extractColumns(line);
            }
            
            // if(totalLines == 4){
                // console.log(line);
            let m = extractMovie(line);
            // console.log(m);
            await insert(m);
                
                // process.exit(0)
            // }
            // let m = extractMovie(line);
            totalLines ++;
        }))
    })


    var insert = (obj) => {
        return new Promise((resolve, reject) => {
            setTimeout( async () => {
                try{
                    let db = objects.databases.movies;
                    await db.insert(obj);
                    resolve();
                }
                catch(err){
                    reject(err);
                }    
            }, 500)
        })
    }
    
    var extractColumns = (line) => {
        var cols = line.split(',');
        for(var col of cols) columns.push(col);

        console.log(columns);
    }

    var extractMovie = (line) => {
        // let fields = ['director_name', 'duration', 'director_facebook_likes' , 'actor_3_facebook_likes', 'actor_2_name', 'actor_1_facebook_likes', 'genres', 'actor_1_name', 'movie_title', 'num_voted_users', 'cast_total_facebook_likes', 'actor_3_name', 'plot_key_words', 'movie_imdb_link', 'num_user_for_reviews', 'language', 'country', 'budget', 'title_year', 'actor_2_facebook_likes', 'imdb_score', 'movie_facebook_likes'     ];
        
        let cols = line.split(',');
        let idx = 0, obj = {};
        for(let col of cols){
            switch(columns[idx]){
                case 'num_critic_for_reviews':
                case 'duration':
                case 'director_facebook_likes':
                case 'actor_3_facebook_likes':
                case 'actor_1_facebook_likes':
                case 'gross':
                case 'num_voted_users':
                case 'cast_total_facebook_likes':
                case 'facenumber_in_poster':
                case 'num_user_for_reviews':
                case 'budget':
                case 'actor_2_facebook_likes':
                case 'movie_facebook_likes':
                    try{
                        col = parseInt(col);
                    }
                    catch(err){
                        col = 0;
                    }
                    break;
                case 'imdb_score':
                case 'aspect_ratio':
                    try{
                        col = parseFloat(col);
                    }
                    catch(err){
                        col = 0.00;
                    }
                    break;
                default:
                    col = col;
                    break;
                
            
            }
            obj[columns[idx]] = col;
            idx ++;
        }
        return obj;
    }
}


const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal:false
})


exports.test = function(args){
    console.log(args);
    process.exit(0);
}

////////////////////////////////////////////////////////////
// MODULE API: Resets all databases
////////////////////////////////////////////////////////////

var ENGINE_SQLITE     = "SQLITE3";      // SQLITE database engine selection
var ENGINE_MYSQL      = "MySQL";        // MYSQL database engine selection
var once = false;

exports.called_from_migration_file = false;

exports.reset = function()
{
  if(once) { return; }
  once=true;

  var callback = function(err){
      if(err){ console.log('Error -> ' , err); process.exit(1);}
      process.exit(0);
  }

  app.initialize_only_database = true; /// do NOT initialize the HTTP server
  app.startup('', () => {
    if(!dbs.db_initialized) dbs.init();
    glib.log("dbs: reset: started resetting databases");
  
    //== SQLITE3: No need to drop db
    if(dbs.DB_ENGINE == ENGINE_SQLITE) {
      //== Nothing to do at this point; resetDatabases() will reset individual tables
      this.resetDatabases(callback);
    } else
  
    //== MYSQL: DROP DATABASE
    if(dbs.DB_ENGINE == ENGINE_MYSQL) {
      var cmd = "DROP DATABASE IF EXISTS nwpos";
      if(dbs.LOGSQL) glib.log("dbs: reset: SQL->"+cmd);
      db.query(cmd, function(err) {
        if(err) { glib.err("dbs: reset: failed(1)->"+err.code); callback(glib.lasterr()); return; }
        var cmd = "CREATE DATABASE IF NOT EXISTS nwpos";
        if(dbs.LOGSQL) glib.log("dbs: reset: SQL->"+cmd);
        db.query(cmd, function(err) {
          if(err) { glib.err("dbs: reset: failed(2)->"+err.code); callback(glib.lasterr()); return; }
          var cmd = "USE nwpos";
          if(dbs.LOGSQL) glib.log("dbs: reset: SQL->"+cmd);
          db.query(cmd, function(err) {
            if(err) { glib.err("dbs: reset: failed(3)->"+err.code); callback(glib.lasterr()); return; }
            dbs.resetDatabases(callback);
          });
        });
      });
    }
  })
}

////////////////////////////////////////////////////////////
// HELPER FUNCTION : Reset all databases 
////////////////////////////////////////////////////////////
exports.resetDatabases = function(callback)
{
  var self = this;
  console.log('Reset')
  var idx = 0;
  var docreate = async function(idx) 
  {
    var dbf = dbs.dbdefs.dblist[idx];
    if(dbf.name !== 'json_schema' && dbf.name !== 'migrations') await self.insert_database_schema(dbf.name);
    // glib.log("dbs: resetting: " + dbf.name);
    dbs.create(dbf, function(err) {
      if(err) { callback(err); return; }
      if(++idx >= dbs.dbdefs.dblist.length) { callback(); return; }  // 
      docreate(idx);
    }); 
  }
  docreate(idx);
}

///////////////////////////////////////////////////
///// MIGRATION API : Update a field inside the table
///// -- No changes in the schema -- this function will be called only from apply/unapply migration
///////////////////////////////////////////////////
module.exports.update_db_field = async function(dbname, fname, callback){
    var self = this;
    app.initialize_only_database = true; /// do NOT initialize the HTTP server ///
    app.startup('', function(err){
        if(err) { console.log('Failed to initialize database'); process.exit(1); return; }
        
        glib.readJSONfile(fname).then(model => {
            try{ model = JSON.parse(model)}
            catch(err){}
            
            /// dbname check 
            if(!(dbname in objects.databases)){ console.log('Database table ' + dbname + ' not found'); process.exit(1); return; }

            var db = objects.databases[dbname];
            db.updatecolumn(model).then(() => {
                console.log('Successfully updated ' + dbname + ' table : ' + fname);
                if(callback) callback();
                process.exit(0);
            }).catch(err => {
                console.log('Failed to update ' + dbname);
                console.log(err);
                if(callback) callback(err);
                process.exit(1);
            })


        }).catch(err => {
            console.log('Failed to load model file');
            console.log(err);
            process.exit(1)
        })
    })
}

///////////////////////////////////////////////////
///// CMD API & MIGRATION API : Adding a field inside the table
///////////////////////////////////////////////////
module.exports.add_db_field = async function(dbname, fname, type='str', len=160 , def='Test field', callback){
    var self = this;
    app.initialize_only_database = true; //// do not initialize the HTTP server //// 
    app.startup('', function(err){
        if(err) { console.log('Failed to initialize database'); process.exit(1); return;}
        
        var temp = {fname:fname, type:type, len:len, def:def}
    
        if(!(dbname in objects.databases)) { console.log('Database table ' + dbname + ' not found '); process.exit(1); return;}
        var db = objects.databases[dbname];
        db.addcolumn(temp).then( async () => {
            console.log('Successfully added ' + fname + ' to ' + dbname);
            if(self.called_from_migration_file){
                if(callback) callback()
            }
            else{
                self.add_field(dbname, fname, type, len, def);
            }
            // process.exit(0);
        }).catch(err => {
            console.log('Failed to add column');
            if(callback) callback(err);
            else process.exit(1);
        })
    })

}

//////////////////////////////////////////////////////
//// CMD API & MIGRATION API : Removing a field from table
//////////////////////////////////////////////////////
module.exports.remove_db_field = async function(dbname, fname, callback){
    var self = this;
    app.initialize_only_database = true; //// do NOT initialize the HTTP server ////
    app.startup('', (err) => {
        if(err) { console.log('Failed to initialize database'); process.exit(1); return;}
        
        var temp = {fname:fname};
        if(!(dbname in objects.databases)) { console.log("Database table " + dbname + ' not found'); process.exit(1); return;}

        var db = objects.databases[dbname];
        db.removecolumn(temp).then( () => {
            console.log('Sucessfully removed ' + fname + ' from ' + dbname);
            if(self.called_from_migration_file){
                if(callback) callback();
            }
            else self.remove_field(dbname, fname);
        }).catch(err => {
            console.log('Failed to remove column');
            // console.log(err);
            process.exit(1);
        })
    })
}

///////////////////////////////////////////////////////
//// CMD API & MIGRATION API : Adding a table in the database
///////////////////////////////////////////////////////
var once = false;
module.exports.addmodel = async function(dbname, callback){
    const self = this;
    if(once && !callback) return; /// if called from Command-Line ///
    console.log('Adding a database ' + dbname);
    once = true;
    app.initialize_only_database = true; /// do NOT initialize the HTTP server ///
    app.startup('', (err) => {
        if(err) { console.log('Failed to intialize database'); process.exit(1); return; }
        init().then( () => {
            console.log('Success!');
            if(callback){
                callback();
                return;
            }
            process.exit(0);
        }).catch(err => {
            console.log('Error ');
            if(err) console.log(err);
            if(callback){
                callback(err);
                return;
            }
            process.exit(1);
        })
    })

    const init = async function(){
        await create_resource(dbname);
    
        await update_databases_json(dbname);

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
    console.log('Creating resource .....');
    let name = dbname + 'Resource';
    let path = './resources/' + name + '.js';

    let script = '';
    
    /// GENERATE A RESOURCE-CLASS SCRIPT FILE ///

    script = '\
    var glib    = require("../glib.js");\n\
    var objects = require("../db.js");\n\
    var dbs     = require("../dbs.js");\n\
    var master  = require("./master.js");\n\
    \n\
    exports.' + name + ' = class extends master.masterResource {\n\
        constructor(){\n\
            super();\n\
            this.' + dbname + ' = objects.databases.' + dbname + ';\n\
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
                        console.log('Terminate process');
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
// HELPER FUNCTION : Insert a record in json_schema database 
// ========================
module.exports.insert_database_schema = function(dbname){
    String.prototype.replaceAt=function(index, replacement) {
        return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
    }

    return new Promise( (resolve, reject) => {
        const filename = './models/' + dbname + '.json';
        console.log('File name : ' , filename);
        glib.readJSONfile(filename).then(async (table) => {
            var data = table;
            try{ data = JSON.stringify(table, null , 4); }
            catch(err) { console.log(err); reject(err); return; }
            data = data.replaceAt(0, "'");
            data = data.replaceAt(data.length-1, "'");
            
            try{
                // ## BEGIN TRANSACTION //
                let begin = "BEGIN TRANSACTION;";
                await dbs.customQuery(null,begin,[]);

                // ## DELETE OLD json_schema RECORD //
                let remove = 'DELETE FROM json_schema WHERE tablename=?';
                await dbs.customQuery(dbs.dbdefs.json_schema,remove,[dbname]);

                // ## INERT NEW json_schema RECORD -- the .json model file that we got //
                let insert = "INSERT INTO json_schema (tablename,schema) VALUES('" + dbname + "'," + data + ");";
                await dbs.customQuery(dbs.dbdefs.json_schema,insert,[]);

                // ## COMMIT SQL QUERIES //
                let commit = 'COMMIT;';
                await dbs.customQuery(dbs.dbdefs.json_schema,commit,[]);
            }
            catch(err){
                console.log('Error :::: ' , err);
                reject(err);
            }
        }).catch(err => {
            console.log('File ' + filename + ' not found');
            reject(err);
        })
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
                        console.log('Overwriding registered endpoint for ' + dbname);
                        // console.log('Aborting process =====> ' + dbname + ' already exists');
                        registered.registered_endpoints.splice(i,1);
                    }
                    i++;
                }

                registered.registered_endpoints.push(temp);
                registered = JSON.stringify(registered, null ,4);

                glib.writeJSONfile('./registered.json', registered).then(() => {
                    console.log('Completed adding a registered endpoint');
                    resolve();
                }).catch(err => {
                    console.log('Failed to register endpoint');
                    console.log(err);
                    reject(err);
                })
            })
        }
        catch(err){
            console.log(err);
            reject();
        }
    }) 
}

/////////////////////////////////////////////
/// HELPER FUNCTION : Creating a table in the database
////// Reading json model from file -- and append it to dbs.create 
/////////////////////////////////////////////
var create_database_table = function(dbname){
    return new Promise ( async (resolve, reject) => {
        var filename = './models/' + dbname + '.json';
        glib.readJSONfile(filename).then( database => {
            if(database && database !== '' && typeof(database) == 'object' && dbname in database){
                console.log('Terminating process cause of failure');
                console.log('Database ' + dbname + ' already exists');
                reject();
                return;
            }
            else{
                try{ database = JSON.parse(database)}
                catch(err){}
                var dbf = database[dbname];
                dbs.create(dbf, function(err){
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
                    console.log('Terminating process cause of failure');
                    console.log('Database ' + dbname + ' already exists');
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
                        console.log('Completed database model insert.');
                        resolve();
                    }).catch(err => {
                        console.log(err);
                        reject();

                    })
                }
            }).catch(err => {
                console.log(err);
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
                console.log('Completed database model insert.');
                resolve();
            }).catch(err => {
                console.log(err);
                reject();

            })
        }
    })
}


var missing_field = function(field){
    console.log("Missing field : " + field);
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
            console.log('No database ' + dbname + ' found');
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
            console.log('Successfully removed ' + fname + ' from ' + dbname);
            await self.insert_database_schema(dbname);
            process.exit(0);
        }).catch(err => {
            console.log('Failed to write in JSON file.');
            process.exit(1);
        })
    }).catch( err => {
        console.log('File + ' + filename + ' not found.');
        process.exit(1);
    })
}


////////////////////////////////////////////////////////////
// MODULE API : Import field in schema(database) JSON file.
//// ---- Call 'add_db_field' to also append it in the database ----
// ========================
module.exports.add_field = function(dbname, fname, type, len, def, hlp){
    var self = this;
    console.log('Adding field to model');
    if(!dbname) missing_field('"dbname" ------> Table name');
    if(!fname) missing_field('"fname" ----> Field name');
    if(!type) missing_field('"type" ----> Field type');
    

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
            console.log('No database ' + dbname + ' found');
            process.exit(1);
        }

        let fields = databases[dbname]['fields'];
        if(!fields) fields = [];

        for(let f of fields){
            if(f.fname == fname){
                console.log('Field ' + fname + ' already exists in ' + dbname);
                process.exit(1);
            }
        }

        let temp = {
            fname:fname,
            type:type,
            len:parseInt(len),
            def:def
        }
        if(hlp) temp['hlp'] = hlp;

        fields.push(temp);

        databases = JSON.stringify(databases, null, 4);
        
        // glib.writeJSONfile(filenname, databases).then(() => {
        glib.writeJSONfile(filename,databases).then( async () => {
            console.log('Successfully added field ' + fname);
            await self.insert_database_schema(dbname);
            process.exit(0);
        }).catch(err => {
            console.log('Failed to add ' + fname + ' in ' +dbname);
            console.log(err);
            process.exit(1);
        })
    }).catch(err => {
        console.log('File ' + filename + ' not found');
        process.exit(1);
    })
}