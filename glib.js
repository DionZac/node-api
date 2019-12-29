//*********************************************************************
// Generic functions
//*********************************************************************
var util  		= require('util');
var stack 		= require('stack-trace');
var moment      = require('moment');
const fs        = require('fs');
var trace		= stack.get();

var glib = this;
var dbs  = require('./dbs.js');

exports.logged = [];

exports.not_found_error = function(res){
  console.log('Request not found');
  res.send('Request not found');
}

exports.loadMigrationFiles = function(){
  let dirname = './migrations/';
  var objects = {};

  console.log('Loading migration files...');
  return new Promise( (resolve, reject) => {
    fs.readdir(dirname, async(err , filenames) => {
      console.log(filenames);
      if(err) { reject(err); return; }
      resolve(filenames);
    })
  })
}

exports.loadModelFiles = function(){
  let dirname =  './models/';
  var objects = {};
  console.log('Loading model files....');
  return new Promise( (resolve, reject) => {
    fs.readdir('./models', async (err, filenames) => {
      // console.log(filenames);
      if(err) { reject(err); return; }
    
      for(let f of filenames){
        objects[f.replace('.json', '')] = await this.readJSONfile(dirname + f);
      }
      resolve(objects);
    })
  })
}

exports.writeJSONfile = function(file, data){
  return new Promise( (resolve, reject) => {
    fs.writeFile(file,data, (err) => {
      if(err){
        reject(err); return;
      }
      resolve();
    }) 
  })
}

exports.readJSONfile = function(file){
	return new Promise( (resolve, reject) => {
		fs.readFile(file, 'utf8', (err, data) => {  
		    if (err) {
				reject(err);
				return;
			}
      let json = data;
      
			resolve(json);
			return;
		});
	})
}

// Parse the schema to replace the special characters ///
exports.parseModelSchema = function(schema){
  schema = schema.replace(/\\n/g, '');
  schema = schema.replace(/\\r/g, '');
  schema = schema.replace(/\\/g, '');

  try{
    schema = JSON.parse(schema);
  }
  catch(err){}

  return schema;
}

/**
 * Get the @settings object 
 * Update the corresponding variables of 'dbs.js' class
 */
exports.updateSettingsVariables = function(settings){
	dbs.DB_FILE = settings.DB_FILE;
	dbs.LOGSQL  = settings.LOGSQL;
	dbs.DB_ENGINE = settings.database;
}

exports.addZero = function(num){
  if(num >= 10) return num.toString();
  return '0' + num;
}
	
exports.parseArray = function(arr){
	for(var i=0;i<arr.length;i++){
		try{
			arr[i] = JSON.parse(arr[i]);
		}
		catch(err){
			continue;
		}
	}
	return arr;
}

exports.objectIsEmpty = (obj) => {
  return Object.keys(obj).length > 0 ? false : true;
}

///////////////////////////////////////////////////////////////////////
// Clone an object
///////////////////////////////////////////////////////////////////////
exports.cloneObj = function(obj)
{
  return(JSON.parse(JSON.stringify(obj)));
}

///////////////////////////////////////////////////////////////////////
// Return string of object
///////////////////////////////////////////////////////////////////////
exports.dump = function(obj)
{
  return(JSON.stringify(obj));
}

///////////////////////////////////////////////////////////////////////
// Pad left a string with #chr for #count chars
///////////////////////////////////////////////////////////////////////
exports.padLeft = function(s, chr, count)
{
  while(s.length < count) s = chr + s;
  return(s);
}

///////////////////////////////////////////////////////////////////////
// Convert date to string (null date defaults to current)
//  -- Pass format to return at specific format
///////////////////////////////////////////////////////////////////////
exports.dateTimeStr = function(d, format)
{
  if(!d) d = new Date();
  var dd = glib.padLeft(d.getDate().toString(),              '0', 2);
  var mm = glib.padLeft((d.getMonth()+1).toString(),         '0', 2);
  var yy = glib.padLeft((d.getFullYear() - 2000).toString(), '0', 2);
  var h  = glib.padLeft(d.getHours().toString(),             '0', 2);
  var m  = glib.padLeft(d.getMinutes().toString(),           '0', 2);
  var s  = glib.padLeft(d.getSeconds().toString(),           '0', 2);

  if(!format) return(dd+'-'+mm+'-'+yy+' '+h+':'+m+':'+s);

  switch(format){
    case 'dd-mm-yyyy':
      return dd + '-' + mm + '-' + yy;
    case 'mm-dd-yyyy':
      return mm + '-' + dd + '--' + yy;
    case 'yyyy-mm-dd':
      return yy + '-' + mm + '--' + dd;
    default:
      return dd + '-' + mm + '-' + yy + ' ' + h + ':' + m + ':' + s;
  }
}

///////////////////////////////////////////////////////////////////////
// HTTP request: get parameters either from body or url
///////////////////////////////////////////////////////////////////////
exports.getRequestParams = function(req)
{
  if(!('method' in req)) return({});
  switch(req.method) 
  {
    case 'get':  case 'GET':  if(!('query' in req)) return({}); return(req.query); 
    case 'delete': case 'DELETE': case 'put':  case 'PUT': case 'post': case 'POST': if(!('body'  in req)) return({}); return(req.body);
    default: return({});
  }
}

///////////////////////////////////////////////////////////////////////
// Logging console functions
///////////////////////////////////////////////////////////////////////
var loghist = { lasterr:'', head:0, tail:0, data:[] };

exports._log = function(data, type)
{
  if(type == undefined) type = 0;
 
  var trace = stack.get();
  
  loghist.data[loghist.head] = { 
    date:     glib.dateTimeStr(), 
    type:     type, 
    msg:      data, 
    fileName: trace[2].getFileName(), 
    funcName: trace[2].getFunctionName(), 
    lineNo:   trace[2].getLineNumber()  
  };
  loghist.head++; loghist.head &= 255;
  if(loghist.head == loghist.tail) { loghist.tail++; loghist.head &= 255; }
  if(type==1) console.log(data,true)
  else console.log(data);
}

exports.log    = function(data, type) { exports._log(data, type); }

exports.getlog = function(type)
{
  var out = [], count = 0, idx = loghist.tail;
  while(idx != loghist.head) { 
    if(type != undefined && loghist[idx].type != type) continue;
    out[count++] = loghist.data[idx]; 
    idx++; idx &= 255; 
  }
  return(out);
}


exports.clearlog = function()     { loghist = { lasterr:'', head:0, tail:0, data:[] }; }
exports.lasterr  = function()     { return(loghist.lasterr); }
exports.err      = function(data) { loghist.lasterr = data; glib.log(data, 1); }

