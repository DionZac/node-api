//**********************************************************
// APP MAIN
//**********************************************************
/*var gui     = require('nw.gui');
var win     = gui.Window.get();
win.showDevTools();
*/
//**********************************************************
// Import modules
//**********************************************************
var fs = require('fs');

var express     = require('express');
var server      = express();
var http        = require('http').Server(server);
var bodyParser  = require('body-parser');
var util        = require('util');
var Monitor     = require('monitor');
var port        = /*process.argv[2] || */80;
var cluster = require('cluster');





// App
var dbs         = require('./dbs.js');
var glib        = require('./glib.js');
var handler     = require('./handler.js');
var urls        = require('./urls.js');

var logFile = fs.createWriteStream('log.txt',{flags:'a'});
var logStdout = process.stdout;



var count = 0;

var app         = this;
var static_root = '/nweb1';

Settings = {};

//**********************************************************
// Global defs

exports.local = [];




/////////////////////////////////////// SSH TESTS /////////////////////////////////















/////////////////////////////////////////////////////////////////////////////////////









//**********************************************************


////////////////////////////////////////////////////////////
// APP: Startup sequence
//    - Args: array of params (command line)
////////////////////////////////////////////////////////////
exports.settings = {};
exports.initialize_only_database = false;
exports.startup = async function(args,callb)
{
	if (cluster.isMaster && !app.initialize_only_database) {
  cluster.fork();
  
  
   
  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });
}
  
  else{
	  if(!args) args = [];  // can plug in default


 /// initialize settings from 'settings.json' file ///
  try{
    var settings = await glib.readJSONfile('settings.json')
    try{ settings = JSON.parse(settings);}
    catch(err){}
  }
  catch(err){
    throw new Error("Invalid or missing 'settings.json' file.")
  }
  
  port = settings.PORT;
  this.settings = settings;
  Settings = settings; /// global inform 
  
  glib.updateSettingsVariables(settings);

 /// Init major modules
 /// this should work with promises instead of callbacks ///
  app.databaseInit(args,async function(err){
    if(err) { glib.serverlog(err, 0) ; callb(err); return;}
    if(!app.initialize_only_database){
      await handler.intialize_resources();
      await handler.initializeAuthorizationClasses();

      app.serverInit(args);
      glib.serverlog(`Server started @port : ${port}` , 1)
    }
    if(callb) callb();
  });
  

  /// Startup web UI 
  //window.location.replace("http://127.0.0.1/index.html");
  }
}

////////////////////////////////////////////////////////////
// APP: Init database manager
////////////////////////////////////////////////////////////

exports.databaseInit = function(args, callb)
{
  /// make this work with promises instead of callbacks ////
  dbs.init(function(){
    dbs.connect(dbs.DB_FILE,function(err){
      if(err) { glib.err("startup: db connect failed->"+err); if(callb) callb(err); return; }
      
      if(callb) callb();
    });
  });
}

////////////////////////////////////////////////////////////
// APP: Init server & comms
////////////////////////////////////////////////////////////
exports.serverInit = function(args)
{
  /////////////////////////// Express server setup


  // TODO: 
  //   check request lengths (not to break header)
  //   http://stackoverflow.com/questions/19917401/node-js-express-request-entity-too-large
  // TODO:
  /*   ----> Add ability to serve pre-gzipped files (example below)
  server.use(function(req, res, next) {
           if (requested-file-is-index.html) {
             req.url = "/static/index.html.gz";
             res.setHeader('Content-Encoding', 'gzip');
             res.setHeader('Content-Type', 'text/html; charset=utf-8');
           }
           next();
       });
  */
  server.enable('etag', 'weak');
  server.all('/*', function(req, res, next) {
     res.header("Access-Control-Allow-Origin", "*");
     res.header("Access-Control-Allow-Methods", "*")
     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
     next();
  });
  
 

  server.use(function(req, res, next) 
  {   
    if(req.url.indexOf('.manifest') != -1) {
      res.header('Content-Type', 'text/cache-manifest');
      res.header('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT');
      next();
      return;
    } 
  
    if(req.url.match(/(.png|.jpg|.jpeg|.svg|.woff|.woff2|.ttf|.otf|.eot)/)) {
      res.header('Cache-Control', 'max-age=691200');
    } else {
      res.header('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT');
    }
    next();
  });

  /// Set the default index from 'setting.json' -- if null do not allow it ///
  server.get('/', function(req, res) { res.sendFile(__dirname + static_root + '/index.html'); });
  
  //// set the limit in 'settings.json' -- if null do not configure it ///
  server.use(bodyParser.json({limit:'20mb'}));
  server.use(bodyParser.urlencoded({limit: '20mb', extended: true}));

  /// set which folders are being included in 'settings.json' -- if null do not include anything ///
  server.use(express.static(__dirname + static_root));

  // configure all accepted requests //
  urls.registerRequestServices(server);
  
  http.listen(port, function() {
    glib.log("startup: server started @ port " + port);
    // glib.log("MEMORY END-INIT: "+util.inspect(process.memoryUsage()));
  });

}

////////////////////////////////////////////////////////////
// APP: Init process monitor
////////////////////////////////////////////////////////////
exports.monitorInit = function()
{
  exports.procMon = null;
  app.procMon     = new Monitor({ probeClass:'Process' });
  app.procMon.connect();
}

////////////////////////////////////////////
app.startup(process.argv);


