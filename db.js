var dbs = require('./dbs.js');
var glib = require('./glib.js');


exports.databases = {};

exports.newdb = class {
  constructor(name){
    this.name = name;
    if(name in dbs.dbdefs){
      this.db = dbs.dbdefs[name];
    }
    else{
      throw 'No db ' + name + ' found.';
    }
  }

  // /** REST API Call Queries */

  // ////// API : 'Filter' (by rowid) //////
  // get(id){
  //   if(!id || typeof(id) !== 'number') { this.read(); return; } /// if no id given -- return ALL
  //   //// else create an object {rowid:id}  --- and call 'filter' function
  //   var config = {rowid:id};
  //   this.filter(config);
  // }

  // ///// API : 'Update'
  // set(){

  // }

  // //// API : 'Insert'
  // put(){

  // }

  // //// API : 'Delete'
  // delete(){

  // }

  between(config){
    const generateQuery = (out, config) => {
      /// function to generate query with given date values ////
      out += ' WHERE ' + config.field + ' BETWEEN ';
      out += '"' +  config.values[0] + '"';
      for(let i=1; i<config.values.length; i++){
        out += ' AND ';
        out += '"' + config.values[i] + '"';
      }

      return out;
    }

    return new Promise((resolve,reject) => {
      // Validate configuration for "between" query search //
      if(!('field' in config) || !('values' in config) || config.values.length < 2){ throw 'Invalid configuration object given for "BETWEEN" database query.';}

      let out = '';
      if('return' in config){
        try{
          out = 'SELECT rowid';

          //// return only specific fields ////
          for(let i=0; i<config.return.length; i++){
            out += ',';
            out += config.return[i]; 
          }
          out += ' FROM ' + this.name;
          out = generateQuery(out, config);
        }
        catch(err){
          throw 'Invalid configuration field : "return" must be an array';
        }
      }
      else{
        out = 'SELECT rowid,* FROM ' + this.name;
        out = generateQuery(out, config);
      }

      dbs.customQuery(this.db, out, [], (err, rows) => {
        if (err) { reject(err); return; }
        else { resolve(rows); return; }
      })

    })
  }

  /**
   * ============================ COMPLEX DATABASE FILTERING =========================== **
   * @param {*} config
   *  =========== configuration object ==================
   *    ============ key : queryset  -----> Array of objects ==============
   *      ============= Every object needs ===============
   *         ============== { field:'fieldname' , value:'value' , condition:'eq', (only if this is not the first object of array) operation:'AND' }
   *         ============== -- If condition == 'btw' -> value:['value1', 'value2'] =================
   * @param {*} out 
   *  =========== out -----> String with specific query to start -- ====================
   */
  filterBy(config,out) {
      return new Promise((resolve, reject) => {
          if(!out) var out = 'SELECT rowid,* FROM ' + this.name + ' WHERE';

          if('queryset' in config){
              var length = config.queryset.length;
              if(length > 1) {
                  out += ' (';
                  for(var i=0; i< config.queryset.length; i++){
                      if( i==0) {
                          out += config.queryset[i].field;
                          switch(config.queryset[i].condition){
                              case 'gte':
                                out += ' >= ';
                                break;
                              case 'gt':
                                out += ' > ';
                                break;
                              case 'eq':
                                out += ' = ';
                                break;
                              case 'lt' : 
                                out += ' < ';
                              case 'lte':
                                out += ' <= ';
                                break;
                              default:
                                    throw new Error("Invalid or missing condition for value");
                          }

                          if(config.queryset[i].condition == 'btw'){
                            try{
                              out += ' BETWEEN "' + config.queryset[i].value[0] + '"';
                              out += ' AND "'     + config.queryset[i].value[1] + '"';
                            }
                            catch(err){
                              throw 'Invalid configuration file for BETWEEN query.';
                            }
                          }
                          else out += config.queryset[i].value;
                      }
                      else{
                          out += ' ' + config.queryset[i].operation + ' ';

                          out += config.queryset[i].field;
                          switch(config.queryset[i].condition){
                              case 'gte':
                                out += ' >= ';
                                break;
                              case 'gt':
                                out += ' > ';
                                break;
                              case 'eq':
                                out += ' = ';
                                break;
                              case 'lt' : 
                                out += ' < ';
                                break;
                              case 'lte':
                                out += '<= ';
                                break;
                              default:
                                  throw new Error("Invalid or missing condition for value");
                          }

                          if(config.queryset[i].condition == 'btw'){
                            try{
                              out += ' BETWEEN "' + config.queryset[i].value[0] + '"';
                              out += ' AND "'     + config.queryset[i].value[1] + '"';
                            }
                            catch(err){
                              throw 'Invalid configuration file for BETWEEN query' ;
                            }
                          }
                          else out += config.queryset[i].value;

                          if(config.queryset[i+1]){

                          }
                          else{
                              out += ');';
                          }
                      }
                  }
              }
          }

          console.log(out);

          dbs.customQuery(this.db,out,[],(err,rows) => {
              if(err) { reject(err); return;}
              else{ resolve(rows); return;}
          })
      })
  }

  limit(index){
    return new Promise((resolve, reject) => {
      dbs.limit(this.db, index, (err, rows) => {
        if(err) { reject(err) ; return; }
        else { resolve(rows); return; }
      })
    })
  }

  get(id){
    if(!id) id = -1;
    return new Promise((resolve,reject) => {
	  	dbs.read(this.db,id,(err,rows) => {
	  		if(err){ reject(err); return;}
	  		else{ resolve(rows); return; }
	  	})
	  })
  }

  filter(fields){
    if(glib.objectIsEmpty(fields)) throw new Error('Empty object given. Cannot filterBy nothing.');
    return new Promise((resolve , reject) => {
      let out = 'SELECT rowid,* FROM ' + this.name + ' WHERE ';
      let first_field = true;
      for(var field in fields){
        console.log('Field value : ' , fields[field]);
          // add exceptions (i.e. 'limit' will be handled after the loop ends)
          if(!first_field && field !== 'limit') out += ' AND ';

          if(field.indexOf('contains__') > -1){
            field = field.split('contains__')[1];
            out += field + ' LIKE "%' + fields['contains__' + field] + '%"';
          }
          else if(field.indexOf('startswith__') > -1){
            field = field.split('startswith__')[1];
            out += field + ' LIKE "' + fields['startswith__' + field] + '%"';
          }
          else if(field.indexOf('endswith__') > -1){
            field = field.split('endswidth__')[1];
            out += field + ' LIKE "%' + fields['endswith__' + field] + '"';
          }
          else if(field.indexOf('__gte') > -1){
            field = field.split('__gte')[0];
            console.log(field);
            out += field + '>=' + fields[field + '__gte'];
          }
          else if(field.indexOf('__lte') > -1){
            field = field.split('__lte')[0];
            out += field + '<=' + fields[field + '__lte'];
          }
          else if(field.indexOf('__gt') > -1){
            field = field.split('__gt')[0];
            out += field + '>' + fields[field + '__gt'];
          }
          else if(field.indexOf('__lt') > -1){
            field = field.split('__lt')[0];
            out += field + '<' + fields[field + '__lt'];
          }
          else if(field.indexOf('__between') > -1){
            var values = fields[field];
            if(!Array.isArray(values) || values.length < 2) throw new Error("Between given but no array or small array given as value");
            field = field.split('__between')[0];
            out += field + ' BETWEEN ' ;
            if(typeof(values[0] == "string" && typeof(values[1]) == "string")){
              out += '"' + values[0] + '" AND "' + values[1] + '"'; 
            }
            else out += values[0] + ' AND ' + values[1];
          }
          else if(field == 'limit'){
            continue;
          }
          else{
            out += field + '=';
            if(typeof(fields[field]) == 'string'){
              /// check for string value to add quotes 
              out += '"' + fields[field] + '"';
            }
            else out += fields[field];
          }

          first_field = false;
      }

      if('limit' in fields){
        out += ' LIMIT ' + parseInt(fields['limit'])
      }

      dbs.customQuery(this.db, out , [], (err, rows) => {
        if(err) { reject(err); return; }
        resolve(rows);
      })

      
    })
  }

  query(fields,values){
    return new Promise((resolve, reject) => {
      dbs.query(this.db, fields, values, (err,rows) => {
        if(err) {console.log('Error on query database record from table : ' + this.db['name'] + '<br> Error : ' + err); reject(err); return; }
        else{ resolve(rows); return; }
      })
    })
  }

  /** ====================================  CUSTOM DATABASE QUERY **************************** // 
   * @param {*} sql [String] -- SQL Query string 
   * @param {*} sql_data [Array] ---- SQL Data  (optional)
   */
  customQuery(sql, sql_data){
    if(!sql_data) sql_data = [];

    return new Promise( (resolve, reject) => {
      dbs.customQuery(this.db,sql, sql_data, (err, rows) => {
        if(err) { reject(err); return}
        else{ resolve(rows); return; }
      })
    })
  }
  
  /** ===================================== DATABASE INSERT QUERY **************************** //
   * @param {*} rec [Object] -- JSON "record" object
  **/
  insert(rec){
    try{
      rec = dbs.newRecord(this.db, rec);
    }
    catch(err){
      throw err;
    }

    return new Promise( (resolve, reject) => {
      dbs.insert(this.db, rec, (err,rowid) => {
        if(err) { reject(err); return; }
        else { resolve(rowid) ; return;}
      })
    })
  }

  /** ======================================= DATABASE UPDATE QUERY ************************** //
   * @param {*} rec [Object] -- JSON "record" object
   *  ----- Note    : Must contain 'rowid' attribute --------- 
   *  ----- Note #2 : Updates ONLY the key-values the given object has -- the rest field stays the same /////
   */
  update(rec){
    return new Promise((resolve, reject) => {
        dbs.updateRecord(this.db, rec, rec.rowid,(record) => {
          dbs.update(this.db, record, (err) => {
            if(err) { reject(err); return; }
            else { resolve(); return; }
          })
        })
    })
  }

  remove(rowid){
    return new Promise((resolve, reject) => {
      dbs.remove(this.db, rowid, (err) => {
        if(err) {console.log('Error on remove database record from table : ' + this.db[name] + '<br> Error : ' + err); reject(err); return; }
        else{ resolve(); return; }
      })
    })
  }
  

  addcolumn(column){
    console.log('Adding column');
    return new Promise( (resolve, reject) => {
      dbs.alter(this.db, 0, column, (err) => {
        if(err) { console.log('dbs : Add Column Failed -> ' + err); reject(err); return ;}
        resolve();
      })
    })
  }

  updatecolumn(column){
    return new Promise( (resolve , reject) => {
      dbs.alter(this.db, 1, column, (err) => {
        if(err) { console.log('dbs: Update column failed -> ' , err); reject(err); return;}
        resolve();
      })
    })
  }

  removecolumn(column){
    return new Promise( (resolve, reject) => {
      dbs.alter(this.db, 2 , column , (err) => {
        if(err) { console.log('dbs: Remove column Failed -> ' + err); reject(err); return; }
        resolve();
      })
    })
  }


  // DATABASE TRANSACTIONS //
  begin(){
    return new Promise((resolve,reject) => {
      let query = 'BEGIN TRANSACTION;';
      dbs.customQuery(this.db,query, [], (err) => {
        if(err) { console.log('Error on begin transaction : ' , this.db); reject(err); return; }
        else { resolve(); return; }
      })
    })
  }

  end(){
    return new Promise((resolve, reject) => {
      let query = 'END;';
      dbs.customQuery(this.db, query, [], (err) => {
        if(err) { console.log('Error on END transaction :  ' , this.db); reject(err); return;}
        else { resolve(); return; }
      })
    })
  }

  rollback(){
    return new Promise((resolve, reject) => {
      let query = 'ROLLBACK;'
      dbs.customQuery(this.db, query , [], (err) => {
        if(err) { console.log('Error on ROLLBACK -> SQL transaction : ' , this.db); reject(err); return; }
        else { resolve(); return;}
      })
    })
  }

  commit(){
    return new Promise((resolve, reject) => {
      let query = 'COMMIT;'
      dbs.customQuery(this.db, query , [], (err) => {
        if(err) { console.log('Error on COMMIT -> SQL transaction : ' , this.db); reject(err); return; }
        else { resolve(); return;}
      })
    })
  }

}