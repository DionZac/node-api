//**********************************************************
// System database manager
//**********************************************************

//** Includes
var fs                = require("fs");
var sqlite3           = require('sqlite3').verbose();
var mysql             = require('mysql');
var glib              = require("./glib.js");
var objects           = require('./db.js');
// var app               = require('./app.js');

//** Module vars
var dbs               = this;
var init              = 0;
var dbdefs            = {};
var db                = null;
var dbc               = null;

exports.db_initialized = false;

//** Constants
exports.DB_FILE; // Default name for database

var ENGINE_SQLITE     = "SQLITE3";      // SQLITE database engine selection
var ENGINE_MYSQL      = "MySQL";        // MYSQL database engine selection

exports.LOGSQL;

exports.DB_ENGINE;
// var dbs.DB_ENGINE         = ENGINE_SQLITE;  // Select one of the database engines avail
// var dbs.DB_ENGINE         = ENGINE_MYSQL;  // Select one of the database engines avail

//**********************************************************
// DATA TYPES
//**********************************************************
var _intCheck = function(f, val) { val = parseInt(val); return(isNaN(val)?0|0:val);    }
var _strCheck = function(f, val) { val = val.toString().substr(0, f.len); return(val); }
var _fltCheck = function(f, val) { val = Number(val);   return(isNaN(val)?0:val);      }
var _binCheck = function(f, val) { return((val == "true" || val == "1" || val == true)?1:0); }
var _lnkCheck = function(f, val) { return(isNaN(val = parseInt(val)) ? -1 : val);        }

exports.types = {
  i8:   { sqltype:'TINYINT',    parse:_intCheck },
  i16:  { sqltype:'SMALLINT',   parse:_intCheck },
  i32:  { sqltype:'INT',        parse:_intCheck },
  i64:  { sqltype:'BIGINT',     parse:_intCheck },
  str:  { sqltype:'VARCHAR',    parse:_strCheck },
  lnk:  { sqltype:'MEDIUMINT',  parse:_lnkCheck },
  ico:  { sqltype:'MEDIUMINT',  parse:_intCheck },
  amt:  { sqltype:'DOUBLE',     parse:_fltCheck },
  qty:  { sqltype:'DOUBLE',     parse:_fltCheck },
  f:    { sqltype:'TINYINT',    parse:_binCheck },
  date: { sqltype:'BIGINT',     parse:_intCheck },
  sel:  { sqltype:'SMALLINT',   parse:_intCheck },
  opt:	{ sqltype:'VARCHAR',	parse:_strCheck },
  cat:  { sqltype:'SMALLINT',   parse:_intCheck },
  id :  { sqltype:'INT'     ,   parse:_intCheck }
  // sort: { sqltype:'SMALLINT',   parse:_intCheck }
};

exports.dbdefs = dbdefs;
exports.dbeng  = dbs.DB_ENGINE;


////////////////////////////////////////////////////////////
// Check if a field is numeric
////////////////////////////////////////////////////////////
exports.isFieldNumeric = function(f)
{
  return(['i8','i16','i32','i64','amt','qty'].indexOf(f.type) != -1);
}

////////////////////////////////////////////////////////////
// API: Initialize db engine
////////////////////////////////////////////////////////////
exports.init = async function(callb)
{
  if(init){ callb(); return;}
  glib.log("dbs: initializing database (engine \""+dbs.DB_ENGINE+"\")");
  init = 0;

  //********************************************
  // Open/init
  //********************************************
  dbs.dbfile      = dbs.DB_FILE;
  dbdefs.dblist   = [];

  glib.loadModelFiles().then(dbfiles => {
    // let databases = await glib.readJSONfile('./databases.json');
    // try{databases = JSON.parse(databases);}
    // catch(err){}

    // console.log('files-> ' ,dbfiles);
  
    for(let dbfile in dbfiles){
      let database = dbfiles[dbfile];
      try{ database = JSON.parse(database);}
      catch(err) {}

      for(let dbname in database) {
        dbdefs[dbname] = database[dbname];
        dbdefs.dblist.push(database[dbname]);
      }
    }
  
    /**
     * Call function to create the instance of database for global use
     */
    dbs.createDatabaseModuleInstance();
  
  
    //== Done; indicate init 
    init = true; 
    dbs.db_initialized = true;
    
    if(callb) callb();
  }).catch(err => {
    console.log(err);
  })

 
}

/**
 * Create database module instance
 * =====================================
 *  -- Use every 'dbdefs.dblist'
 */
exports.createDatabaseModuleInstance = function(){
  for (var dbname in dbdefs) {
    var dbinstance = new objects.newdb(dbname);
    objects.databases[dbname] = dbinstance;
  }
}

////////////////////////////////////////////////////////////
// API: Connect to database
// ========================
// - 'to' points to database file (SQLITE3) ..OR..
// - 'to' points to database location and credentials (MySQL)
//          {host:'localhost', user:'invibit, pass:'inv2012', database:'nwpos' /*optionals--> [connectTimeout:10000], [port:3306] */ }
//        alternative: pass as URL
//          'mysql://user:pass@host/db?debug=true&charset=BIG5_CHINESE_CI&timezone=-0700'
////////////////////////////////////////////////////////////
exports.connect = function(to, callback)
{
  if(!callback) callback = function(){};
  if(!init) dbs.init();

  //** SQLITE3
  if(dbs.DB_ENGINE == ENGINE_SQLITE) {
    db = new sqlite3.Database(to, function(err) {
      if(err) { glib.err("dbs: connect: error->"+err); callback(glib.lasterr()); return; }
	    console.log("Connected to main database ");
      callback();
      return;
    });
    
  }

  //** MySQL
  if(dbs.DB_ENGINE == ENGINE_MYSQL) {

    //==
    if(typeof(to) == "object") { to.supportBigNumbers = true; /*to.debug = true;*/ }
    db = mysql.createConnection(to);
    if(!db) { glib.err("dbs: connect: invalid connection data"); callback(glib.lasterr()); return; }
    glib.log("dbs: connect: "+glib.dump(to));
    db.connect(function(err) {
      if(err) { if('end' in db) db.end(); db = null; glib.err("dbs: connect: error->"+err); callback(glib.lasterr()); return; }
      //== Select database
      var cmd = "USE nwpos";
      if(dbs.LOGSQL) glib.log("dbs: connect: SQL->"+cmd);
      db.query(cmd, function(err) {
        if(err) { glib.err("dbs: connect: failed->"+err.code); callback(glib.lasterr()); return; }
        glib.log("dbs: connect: OK");
        callback();
      });
      
    });
    return;
  }
  return;
}



////////////////////////////////////////////////////////////
// API: Create defined database table 
// ==================================
// - Called from 'dbs.reset()' to form new tables
////////////////////////////////////////////////////////////
function outputField(fld, idx) 
{
  console.log(fld);
  var out = '';
  if(!(fld.type in dbs.types)) { throw "ERR: Caught unsupported type in selected db engine ('"+fld.type+"')"; }
  out += fld.fname + (idx != -1? ('_' + idx) : '') + ' ' + dbs.types[fld.type].sqltype;
  if(fld.len) out += '('+fld.len+')';
  return(out);
}

exports.create = function(dbf, callback) 
{
  if(!callback) callback = function(){};

  //== Checks
  if(!db)  { glib.err("dbs: create: failed, not connected");               callback(glib.lasterr()); return; }
  if(!dbf) { glib.err("dbs: create: failed, invalid database descriptor"); callback(glib.lasterr()); return; }
  if(!init) dbs.init();
 
  //== Log
  glib.log("dbs: creating database ["+dbf.name+"]");

  //== Prep CREATE TABLE query
  var cmd = 'CREATE TABLE '+dbf.name+' (';
  if(dbs.DB_ENGINE == ENGINE_MYSQL) cmd += 'rowid MEDIUMINT NOT NULL AUTO_INCREMENT, ';
  for(var i=0; i<dbf.fields.length; i++) {
    var dim = 0, f = dbf.fields[i];
    if('size1' in f) dim = f.size1;
    if('size2' in f) if(f.size2) dim *= f.size2;
    if(dim) {
      for(var j=0; j<dim; j++) { if(i || j) cmd += ','; cmd += outputField(f, j); }
    } else {
      if(i) cmd += ','; 
      cmd += outputField(f, -1);
    }
  }
  if(dbs.DB_ENGINE == ENGINE_MYSQL) cmd += ', PRIMARY KEY (rowid)';
  cmd += ')';

  console.log(cmd)
  //== Create (SQLITE3)
  if(dbs.DB_ENGINE == ENGINE_SQLITE) {
    var precmd = 'DROP TABLE IF EXISTS '+dbf.name;
    if(dbs.LOGSQL) glib.log("dbs: create: SQL->"+precmd);
    db.run(precmd, function(err) {
      if(err) glib.log("dbs: create: DROP error, ignoring ("+err+")");
      if(dbs.LOGSQL) glib.log("dbs: create: SQL->"+cmd);
      //== NOTE: 'cmd' is prepared
      db.run(cmd, function(err) {
        if(err) { glib.err("dbs: create: failed, error->"+err); callback(glib.lasterr()); return; }
        callback();
      });
    });
  } else
  //== Create (MYSQL)
  if(dbs.DB_ENGINE == ENGINE_MYSQL) {
    var precmd = 'DROP TABLE IF EXISTS '+dbf.name;
    if(dbs.LOGSQL) glib.log("dbs: create: SQL->"+precmd);
    db.query(precmd, function(err) {
      if(err) glib.log("dbs: create: DROP error, ignoring ("+err+")");
      //== NOTE: 'cmd' is prepared
      if(dbs.LOGSQL) glib.log("dbs: create: SQL->"+cmd);
      db.query(cmd, function(err) {
        if(err) { glib.err("dbs: create: failed, error->"+err); callback(glib.lasterr()); return; }
        callback();
      });
    });
  }
}

////////////////////////////////////////////////////////////
// API: Update (write) existing record to database
////////////////////////////////////////////////////////////
exports.update = function(dbf, rec, callback)
{
  if(!callback) callback = function(){};

  //== Checks
  if(!db)                               { glib.err("dbs: update: failed, not connected");                callback(glib.lasterr()); return; }
  if(!dbf)                              { glib.err("dbs: update: failed, invalid database descriptor");  callback(glib.lasterr()); return; }
  if(!rec || typeof(rec) != "object")   { glib.err("dbs: update: failed, invalid record");               callback(glib.lasterr()); return; }
  if(!('rowid' in rec))                 { glib.err("dbs: update: failed, rowid not in record");          callback(glib.lasterr()); return; }
  
  //== Construct update sql command				            // isquotable(f.type) <- f.type == 'str'
  
  var output = function(fname, f, v) { return(fname + '=' + (isQuotable(f.type) ? "'"+v+"'": v)); }
  var once = 0, out = 'UPDATE ' + dbf.name + ' ';

  if(dbs.DB_ENGINE == ENGINE_MYSQL) { out += 'SET rowid=' + rec.rowid; once = 1; } 

  for(var i=0; i<dbf.fields.length; i++) {
    var f = dbf.fields[i];
    if(!i && !once) out += 'SET ';
    if(!f.fname in rec) continue;             // Skip fields not defined
    //== Arrays
    if(('size1' in f) && f.size1) {
      if(('size2' in f) && f.size2) {
        //== Array[][]
        for(var j=0; j<f.size1; j++) for(var k=0; k<f.size2; k++) {
          if(once++) out += ','; 
          out += output(f.fname + '_' + (1 + (j * f.size2) + k), f, rec[f.fname][j][k]); 
        }
      } else {
        //== Array[]
        for(var j=0; j<f.size1; j++) {
          if(once++) out += ',';
          out += output(f.fname + '_' + j, f, rec[f.fname][j]);
        }
      }
    } else {
      //== No array: straight out
      if(once++) out += ',';
      out += output(f.fname, f, rec[f.fname]);
    }
  }
  out += " WHERE rowid=" + rec.rowid + ";";
  if(dbs.LOGSQL) glib.log("dbs: update: SQL->"+out);
  
  if(dbs.DB_ENGINE == ENGINE_MYSQL) { 
    db.query(out, function(sqlerr) { 
      if(sqlerr) { glib.err("dbs: update: failed->"+sqlerr); callback(glib.lasterr()); return; }
      callback(); 
    });
  } else 
  if(dbs.DB_ENGINE == ENGINE_SQLITE) {
    db.run(out, function(sqlerr) { 
      if(sqlerr) { glib.err("dbs: update: failed->"+sqlerr); callback(glib.lasterr()); return; }
      callback(); 
    });  
  }
}

////////////////////////////////////////////////////////////
// API: Insert (create new) record to database
////////////////////////////////////////////////////////////
exports.insert = function(dbf, rec, callback,admin)
{
  //== Checks
  if(!callback) callback = function(){};
  if(!dbf)                              { glib.err("dbs: insert: insert, invalid database descriptor");   callback(glib.lasterr()); return; }
  if(!rec || typeof(rec) != "object")   { glib.err("dbs: insert: failed, invalid record");                callback(glib.lasterr()); return; }
  if(dbs.DB_ENGINE == ENGINE_SQLITE && !db) { glib.err("dbs: insert: failed, database not yet initialized");  callback(glib.lasterr()); return; }

  //glib.log("dbs: insert: adding " + dbf.name);
  
  //== Construct update SQL 
  var once = 0, out = '', defrec = dbs.newRecord(dbf);
  out += 'INSERT INTO ' + dbf.name + ' (';

  //== Construct FIELD LIST
  for(var i=0; i<dbf.fields.length; i++) {
    var dim = 0, f = dbf.fields[i];
    if(('size1' in f) && f.size1) dim  = f.size1;
    if(('size2' in f) && f.size2) dim *= f.size2;
    if(!dim) { if(once++) out += ','; out += f.fname; continue; }
    for(var j=0; j<dim; j++) { if(once++) out += ',';  out += f.fname + '_' + j; }
  }
  out += ') VALUES (';
  
  //== Construct VALUES
  var once = 0;
  
  //== In mysql add rowid
  //if(dbs.DB_ENGINE == ENGINE_MYSQL) { out += 'NULL'; once = 1; } 

  for(var i=0; i<dbf.fields.length; i++) {
    var f = dbf.fields[i], obj = ((f.fname in rec) ? rec : defrec);
    //== Arrays
    if(('size1' in f) && f.size1) {
      if(('size2' in f) && f.size2) {
        //== Array[][]
        for(var j=0; j<f.size1; j++) for(var k=0; k<f.size2; k++) {
          if(once++) out += ','; 
          out += (isQuotable(f.type) ? "'" + obj[f.fname][j][k] + "'" : obj[f.fname][j][k]);
        }
      } else {
        //== Array[]
        for(var j=0; j<f.size1; j++) {
          if(once++) out += ',';
          out += (isQuotable(f.type) ? "'"+obj[f.fname][j]+"'" : obj[f.fname][j]);
        }
      }
    } else {
      //== No array: straight out
      if(once++) out += ',';
      out += (isQuotable(f.type) ? "'"+obj[f.fname]+"'" : obj[f.fname]);
    }
  }

  out += ');';
  if(dbs.LOGSQL) glib.log("dbs: insert: SQL->"+out);

  if(dbs.DB_ENGINE == ENGINE_MYSQL) { 
		db.query(out, function(sqlerr, result) { 
		  if(sqlerr) { glib.err("dbs: insert: failed->"+sqlerr); callback(glib.lasterr()); return; }	
		  rec.rowid = result.insertId;	
		  callback(null, rec.rowid); 	
		});		
  } else 
  if(dbs.DB_ENGINE == ENGINE_SQLITE) {
    db.run(out, function(sqlerr) { 
	  if(sqlerr) { glib.err("dbs: insert: failed->"+sqlerr); callback(glib.lasterr()); return; }	
	  rec.rowid = this.lastID;	
	  callback(null, rec.rowid); 	
	});	
  }
}

////////////////////////////////////////////////////////////
// API: Read (absolute) record from database
////////////////////////////////////////////////////////////
//== Output handler
function handleReadOutput(dbf, sqlerr, rows, callback) 
{
  if(sqlerr != null) { glib.err("dbs: read: failed->"+sqlerr); callback(glib.lasterr()); return; }
  var urows = [];
  for(var i=0; i<rows.length; i++) urows.push(dbs._validate(dbf, rows[i]));
  callback(null, urows);
}

exports.limit = function(dbf, limit, callback){
//== Checks
  if(!callback) callback = function(){};
  if(!dbf)                              { glib.err("dbs: read: insert, invalid database descriptor");  callback(glib.lasterr()); return; }
  if(dbs.DB_ENGINE == ENGINE_SQLITE && !db) { glib.err("dbs: read: failed, database not yet initialized"); callback(glib.lasterr()); return; }


  //== Prep read SQL
  var out;
  if(dbs.DB_ENGINE == ENGINE_MYSQL) out = 'SELECT * FROM ' + dbf.name + ' LIMIT ' + limit;
                           else out = 'SELECT rowid, * FROM ' + dbf.name + ' LIMIT ' + limit;
  if(dbs.LOGSQL) glib.log("dbs: read: SQL->"+out);

  //== Issue query
  if(dbs.DB_ENGINE == ENGINE_MYSQL) {
    db.query(out, function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
  } else 
  if(dbs.DB_ENGINE == ENGINE_SQLITE) {
    db.all(out, function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
  }
}

exports.read = function(dbf, rowid, callback)
{
  //== Checks
  if(!callback) callback = function(){};
  if(!dbf)                              { glib.err("dbs: read: insert, invalid database descriptor");  callback(glib.lasterr()); return; }
  if(dbs.DB_ENGINE == ENGINE_SQLITE && !db) { glib.err("dbs: read: failed, database not yet initialized"); callback(glib.lasterr()); return; }

  //== Log
  glib.log("dbs: read: "+dbf.name+": #"+(rowid == -1?"ALL":rowid));

  //== Prep read SQL
  var out;
  if(dbs.DB_ENGINE == ENGINE_MYSQL) out = 'SELECT * FROM ' + dbf.name; 
                           else out = 'SELECT rowid, * FROM ' + dbf.name; 
  if(rowid != -1) out += ' WHERE rowid=' + rowid + ';';
  if(dbs.LOGSQL) glib.log("dbs: read: SQL->"+out);
  
  //== Issue query
  if(dbs.DB_ENGINE == ENGINE_MYSQL) {
    db.query(out, function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
  } else 
  if(dbs.DB_ENGINE == ENGINE_SQLITE) {
    db.all(out, function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
  }
  
  
}

////////////////////////////////////////////////////////////
// API: Query record from database
// cols: array of strings referrer to specific rows 
////////////////////////////////////////////////////////////
//== Output handler
exports.query = function(dbf , cols , data , callback , admin){
	 //== Checks
	if(!callback) callback = function(){};
	if(!dbf)                              { glib.err("dbs: read: insert, invalid database descriptor");  callback(glib.lasterr()); return; }	  if(dbs.DB_ENGINE == ENGINE_SQLITE && !db) { glib.err("dbs: read: failed, database not yet initialized"); callback(glib.lasterr()); return; }
	
	 //== Log
	// glib.log("dbs: read: "+dbf.name+": #"+(rowid == -1?"ALL":rowid));
	
	//== Prepare query 
	var out ;
	if(dbs.DB_ENGINE == ENGINE_MYSQL) 		out  = 'SELECT * FROM ' + dbf.name ;
	else if(dbs.DB_ENGINE == ENGINE_SQLITE) out  = 'SELECT rowid,* FROM ' + dbf.name ;
	
	out += ' WHERE '
	for(var i=0;i<cols.length;i++){
		out += cols[i] + '=? ';
		if(i+1 < cols.length) out += 'AND ';
	}
  console.log(out);
  console.log(data);
	//== Issue query
	if(dbs.DB_ENGINE == ENGINE_MYSQL) {
		 db.query(out, data , function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
	} else 
    if(dbs.DB_ENGINE == ENGINE_SQLITE) {
		db.all(out, data , function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
	}
}


////////////////////////////////////////////////////////////
// API: ** CUSTOM **  Query record from database
////////////////////////////////////////////////////////////
//== Output handler
exports.customQuery = function(dbf , out , data , callback){
	 //== Checks
  if(!callback) callback = function(){};
	//== Issue query
  console.log(out);
	if(dbs.DB_ENGINE == ENGINE_MYSQL) {
		db.query(out , data , function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
	} else 
    if(dbs.DB_ENGINE == ENGINE_SQLITE) {
		db.all(out , data , function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
    }
}

exports.remove = function(dbf,rowid,callback){
	if(!callback) callback = function(){};
	if(!dbf)                              { glib.err("dbs: read: insert, invalid database descriptor");  callback(glib.lasterr()); return; }	  if(dbs.DB_ENGINE == ENGINE_SQLITE && !db) { glib.err("dbs: read: failed, database not yet initialized"); callback(glib.lasterr()); return; }
	
	//== Prepare query 
	var out ;
	if(dbs.DB_ENGINE == ENGINE_MYSQL) 		out  = 'DELETE FROM ' + dbf.name ;
	else if(dbs.DB_ENGINE == ENGINE_SQLITE) out  = 'DELETE FROM ' + dbf.name ;
	
	out += ' WHERE rowid=? ';
	if(rowid.length > 1){
		for(var i=1;i<rowid.length;i++) out += ' OR rowid=?';
	}
	
	//== Issue query
	if(dbs.DB_ENGINE == ENGINE_MYSQL) {
		db.query(out , rowid , function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
	} else 
    if(dbs.DB_ENGINE == ENGINE_SQLITE) {
		db.all(out , rowid , function(sqlerr, rows) { handleReadOutput(dbf, sqlerr, rows, callback); });
    }
	
}

////////////////////////////////////////////////////////////
// API: ALTER TABLE
// ====================
//  Operation - Add column
//    -- column : object
//  Operation - Edit column
//    -- column : object
//  Operation - Remove column
//    -- column : object (only fname:'field' attribute)
////////////////////////////////////////////////////////////
exports.alter = function(dbf,operation,column,callb){
  console.log('Column -> ' , column);
  if(!(typeof(column) == 'object') || !('fname' in column)){ callb('Invalid column object'); return;} /// validate column object
  if(!dbf || !(typeof(dbf) == 'object') || !('fields' in dbf) || !Array.isArray(dbf.fields)) { callb('Invalid column object'); return; } /// validate database table

  //// if something fails -> try again (max 10 times)
  var handle_error_retries = 0;
  var handle_transaction_error = function(){
    let out = 'ROLLBACK';
    handle_error_retries ++;
    dbs.customQuery(dbf, out , [], function(err){
      if(err){
        console.log('Error -> ' , err);
        if(handle_error_retries < 10) handle_transaction_error();
      }
      else console.log('TRANSACTION rolled-back.');
    })
  }

  let fname = column.fname;
  
  switch(operation){
    case 0:
      /// add column ////
      // for(let f of dbf.fields) if(f.fname == fname){ callb('Column ' + fname + ' already exists.'); return;} //// validate field does not exists already
      let out = 'ALTER TABLE ' + dbf.name + ' ADD COLUMN ' 
      out += outputField(column, -1);

      if('def' in column) out += ' DEFAULT "' + column.def + '"';
      console.log(out);
      if(dbs.DB_ENGINE == ENGINE_SQLITE){
        db.run(out, function(sqlerr){
          if(sqlerr) { callb("dbs: add column : failed -> " + sqlerr); return;}
          callb();
        })
      }
      break;
    case 1:
      /// update column ////
      if(dbs.DB_ENGINE == ENGINE_SQLITE){
        //// SQLITE3 ///
        let begin = 'BEGIN TRANSACTION;';
        dbs.customQuery(dbf,begin,[], function(err){
          if(err) { callb('Failed to begin transaction'); handle_transaction_error(); return; }
          var temp = JSON.parse(JSON.stringify(dbf));
          temp['name'] = '__' + dbf.name + '_backup__';
          for(let i=0; i<temp.fields.length; i++) if(temp.fields[i].fname == fname) temp.fields.splice(i,1);
          dbs.create(temp, function(err){
            if(err) { callb('Failed to create temp table ----- ' , err); handle_transaction_error(); return; }
            let q = 'INSERT INTO ' + temp['name'] + ' SELECT';
            for(let f of temp.fields) q += ' ' + f.fname + ','
            q = q.substr(0, q.length -1); /// remove ','

            q += ' FROM ' + dbf.name + ';';
            dbs.customQuery(dbf,q,[], function(err){
              if(err) { callb('Failed to insert all records from original table ------ ' , err); handle_transaction_error();return; }
              let drop = 'DROP TABLE ' + dbf.name + ';';
              dbs.customQuery(dbf, drop , [], function(err){
                if(err) { callb('Failed to drop ' + dbf.name); handle_transaction_error(); return; }
                let rename = 'ALTER TABLE ' + temp['name'] + ' RENAME TO ' + dbf.name + ';';
                dbs.customQuery(dbf,rename , [], function(err) {
                  if(err) { callb('Failed to rename ' + temp.name + ' to ' + dbf.name); handle_transaction_error(); return; }
                  let commit = 'COMMIT;';
                  dbs.customQuery(dbf, commit, [], function(err){
                    if(err) { callb('Failed to COMMIT ------ ', err); handle_transaction_error(); return; }
                    callb();
                  })
                })
              })
              
            }) 
          })

        })
      }
      break;
    case 2:
        /// remove column ////
      if(dbs.DB_ENGINE == ENGINE_SQLITE){
        //// SQLITE3 ///
        let begin = 'BEGIN TRANSACTION;';
        dbs.customQuery(dbf,begin,[], function(err){
          if(err) { callb('Failed to begin transaction'); handle_transaction_error(); return; }
          var temp = JSON.parse(JSON.stringify(dbf));
          temp['name'] = '__' + dbf.name + '_backup__';
          for(let i=0; i<temp.fields.length; i++) if(temp.fields[i].fname == fname) temp.fields.splice(i,1);
          dbs.create(temp, function(err){
            if(err) { callb('Failed to create temp table ----- ' , err); handle_transaction_error(); return; }
            let q = 'INSERT INTO ' + temp['name'] + ' SELECT';
            for(let f of temp.fields) q += ' ' + f.fname + ','
            q = q.substr(0, q.length -1); /// remove ','

            q += ' FROM ' + dbf.name + ';';
            dbs.customQuery(dbf,q,[], function(err){
              if(err) { callb('Failed to insert all records from original table ------ ' , err); handle_transaction_error();return; }
              let drop = 'DROP TABLE ' + dbf.name + ';';
              dbs.customQuery(dbf, drop , [], function(err){
                if(err) { callb('Failed to drop ' + dbf.name); handle_transaction_error(); return; }
                let rename = 'ALTER TABLE ' + temp['name'] + ' RENAME TO ' + dbf.name + ';';
                dbs.customQuery(dbf,rename , [], function(err) {
                  if(err) { callb('Failed to rename ' + temp.name + ' to ' + dbf.name); handle_transaction_error(); return; }
                  let commit = 'COMMIT;';
                  dbs.customQuery(dbf, commit, [], function(err){
                    if(err) { callb('Failed to COMMIT ------ ', err); handle_transaction_error(); return; }
                    callb();
                  })
                })
              })
              
            }) 
          })

        })
      }
      break;
    default:
      callb('Invalid operation');
      return;
  }
}

////////////////////////////////////////////////////////////
// API: Validate record
// =====================
//      - Make sure all current fields are present
//      - All arrays have the right length
//      - All fields are type-checked/corrected
//      - All non-existing fields are deleted from object
////////////////////////////////////////////////////////////
dbs._validate = function(dbf, rec)
{
  var outrec = dbs.newRecord(dbf);

  if('rowid' in rec) outrec.rowid = rec.rowid;

  for(var i=0; i<dbf.fields.length; i++) {
    var dim = 0, f = dbf.fields[i];   
    if(('size1' in f) && f.size1) dim  = f.size1;
    if(('size2' in f) && f.size2) dim *= f.size2;

    //== Non-array case
    if(!dim) { if(f.fname in rec) outrec[f.fname] = rec[f.fname]; continue; }

    //== Array case
    for(var j=0; j<dim; j++) {
      var fname = f.fname + '_' + j;
      if(!fname in rec) continue;
      if(('size2' in f) && f.size2) {
        outrec[f.fname][j / f.size2][j % f.size2] = rec[fname];
      } else {
        outrec[f.fname][j] = rec[fname];
      }
    }    

  }
  return(outrec);
}

//////////////////
// 
/*

INSERT INTO users VALUES('Chris','Revival','vegos50@hotmail.gr','https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/21617915_1458901540858762_6818552646004664469_n.jpg?oh=8b4b8a14e8602741dff69ca066f97d86&oe=5A9E2282','1500343740047875','https://www.facebook.com/1500343740047875','','','03/08/1999','','','','','','')

*/

////////////////////////////////////////////////////////////
// API: Construct & return a new record object based on 
//      database field descriptors
////////////////////////////////////////////////////////////
exports.newRecord = function(dbf, template)
{
  var v, f, rec = {};

  for(var i=0; i<dbf.fields.length; i++) {
    f = dbf.fields[i];
    if(template && (f.fname in template)) v = template[f.fname]; else v = f.def;
    rec[f.fname] = glib.cloneObj(v);
  }
  rec.rowid = 0;
  return(rec);
}

////////////////////////////////////////////////////////////
// API: Get the existing database field (from rowid)
//      and update the given values
////////////////////////////////////////////////////////////
exports.updateRecord = async function(dbf,template,rowid,callb)
{
  try{
    console.log('Db: ' + dbf.name);
    var database = objects.databases[dbf.name];
    var EXISTING_RECORD = await database.filter({rowid:rowid});
    EXISTING_RECORD = EXISTING_RECORD[0];
    console.log(EXISTING_RECORD);
  }
  catch(err){
    console.log('Error');
    // if(dbs.LOGSQL > 0) console.log('Failed to get the object');
    throw new Error(err);
  }
  var v, f, rec = {};
  for(var i=0; i<dbf.fields.length; i++) {
    f = dbf.fields[i];
    if(template && (f.fname in template)) v = template[f.fname]; else v = EXISTING_RECORD[f.fname];
    rec[f.fname] = glib.cloneObj(v);
  }
  rec.rowid = EXISTING_RECORD.rowid;
  console.log(rec);
  callb(rec);
}

function isQuotable(type){
	if(type == 'str' || type == 'opt') return true
	return false;
}



