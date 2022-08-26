var glib = require('../../glib.js');

//**********************************************************
// DATA TYPES
//**********************************************************
var _intCheck = function (f, val) { val = parseInt(val); return (isNaN(val) ? 0 | 0 : val); }
var _strCheck = function (f, val) { val = val.toString().substr(0, f.len); return (val); }
var _fltCheck = function (f, val) { val = Number(val); return (isNaN(val) ? 0 : val); }
var _binCheck = function (f, val) { return ((val == "true" || val == "1" || val == true) ? 1 : 0); }

exports.types = {
    i8: { sqltype: 'TINYINT', parse: _intCheck },
    i16: { sqltype: 'SMALLINT', parse: _intCheck },
    i32: { sqltype: 'INT', parse: _intCheck },
    i64: { sqltype: 'BIGINT', parse: _intCheck },
    str: { sqltype: 'VARCHAR', parse: _strCheck },
    amt: { sqltype: 'DOUBLE', parse: _fltCheck },
    f: { sqltype: 'TINYINT', parse: _binCheck },
    date: { sqltype: 'BIGINT', parse: _intCheck },
    id: { sqltype: 'INT', parse: _intCheck }
};

/**
 * API: Construct & return a new record object based on 
 *      database field descriptors
*/
exports.newRecord = function(dbf, template)
{
  var v, f, rec = {};

  for(var i=0; i<dbf.fields.length; i++) {
    f = dbf.fields[i];
    if(template && (f.fname in template)){
      if(f.size && f.size > 1){
        for(let j=0; j<f.size; j++){
          let t_rec = template[f.fname][j];
          if(t_rec){
            rec[`${f.fname}_${j}`] = t_rec
          }
          else{
            rec[`${f.fname}_${j}`] = f.def || null;
          }
        }
      }
      else{ 
        rec[f.fname] = template[f.fname]
      }
    }
    else{
      if(f.size && f.size > 1){
        for(let j=0; j<f.size; j++){
          rec[`${f.fname}_${j}`] = f.def || null;
        }
      }
      else{
        rec[f.fname] = f.def || null;
      }
    }
  }
  rec.rowid = 0;
  return(rec);
}

/**
 *  API: Get the existing database field (from rowid)
 *       and update the given values
*/
exports.updateRecord = async function(dbf,template,rowid,callb)
{
  try{
    var database = db[dbf.name];
    var EXISTING_RECORD = await database.filter({rowid:rowid});
    EXISTING_RECORD = EXISTING_RECORD[0];
  }
  catch(err){
    glib.serverlog(err,1);
    throw new Error(err);
  }
  var v, f, rec = {};
  for(var i=0; i<dbf.fields.length; i++) {
    f = dbf.fields[i];
    if(template && (f.fname in template)){
      if(f.size && f.size > 1){
        for(let j=0; j<f.size; j++){
          let t_rec = template[f.fname][j];
          if(t_rec){
            rec[`${f.fname}_${j}`] = t_rec;
          }
          else{
            rec[`${f.fname}_${j}`] = f.def || null;
          }
        }
      }
      else{
        rec[f.fname] = EXISTING_RECORD[f.fname];
      }
    }
    else {
      if(f.size && f.size > 1){
        for(let j=0; j<f.size; j++){
          rec[`${f.fname}_${j}`] = EXISTING_RECORD[`${f.fname}_${j}`];
        }
      }
      else{
        rec[f.fname] = EXISTING_RECORD[f.fname];
      }
    }
  }
  rec.rowid = EXISTING_RECORD.rowid;
  callb(rec);
}

/**
 *  Helper : Add fields in "CREATE TABLE" database query *
 */
exports.outputField = (fld, idx) => {
    var out = '';
    if (!(fld.type in this.types)) { throw "ERR: Caught unsupported type in selected db engine ('" + fld.type + "')"; }
    out += fld.fname + (idx != -1 ? ('_' + idx) : '') + ' ' + this.types[fld.type].sqltype;
    if (fld.len) out += '(' + fld.len + ')';
    return (out);
}

exports.isString = (type) => {
    if(this.types[type] && this.types[type].sqltype == "VARCHAR") return true;
    return false;
}