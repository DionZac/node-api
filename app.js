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

var express = require('express');
var server = express();
var http = require('http').Server(server);
var bodyParser = require('body-parser');
var util = require('util');
var Monitor = require('monitor');
var port = /*process.argv[2] || */80;
var cluster = require('cluster');

// Database Engine
var database = require('./modules/db/database.js');

// App
var glib = require('./glib.js');
var handler = require('./handler.js');
var urls = require('./urls.js');

var app = this;

// Global Reference
appRoot = __dirname;
Settings = {};
db = new database();

////////////////////////////////////////////////////////////
// APP: Startup sequence
//    - Args: array of params (command line)
////////////////////////////////////////////////////////////
exports.settings = {};
exports.initialize_only_database = false;
exports.startup = async function (args, callb) {
  if (0==1 && cluster.isMaster && !app.initialize_only_database) {
    cluster.fork();

    cluster.on('exit', function (worker, code, signal) {
      cluster.fork();
    });
  }

  else {
    if (!args) args = [];  // can plug in default

    // initialize settings from 'settings.json' file ///
    try {
      var settings = await glib.readJSONfile('settings.json')
      try { settings = JSON.parse(settings); }
      catch (err) { }
    }
    catch (err) {
      throw new Error("Invalid or missing 'settings.json' file.")
    }

    port = settings.PORT;
    this.settings = settings;
    Settings = settings; /// global inform 

    // Update the corresponding variables of Database Global object //
    db.settings.DB_FILE = settings.DB_FILE;
    db.settings.DB_LOG = settings.DB_LOG;
    db.settings.DB_ENGINE = settings.DB_ENGINE;

    // Initialize major modules and server //
    try {
      await app.databaseInit();
      if (!app.initialize_only_database) {
        await handler.initialize_resources();
        await handler.initializeAuthorizationClasses();

        app.serverInit(args);
        glib.serverlog(`Server started @port : ${port}`, 1);
      }
      return;
    }
    catch (e) {
      glib.serverlog(e,0);
      process.exit(1);
    }

  }
}

////////////////////////////////////////////////////////////
// APP: Init database manager
////////////////////////////////////////////////////////////

exports.databaseInit = async () => {
  // Call the initialization function for the Database //
  try {
    await db.init();
  }
  catch (err) {
    glib.dblog("Database initialization failed for : " + JSON.stringify(err), 0)
    return;
  }

  // Connect to the database //
  try {
    await db.engine.connect();
  }
  catch (err) {
    glib.dblog("Database connection failed for : " + JSON.stringify(err), 0)
  }

}

////////////////////////////////////////////////////////////
// APP: Init server & comms
////////////////////////////////////////////////////////////
exports.serverInit = async function (args) {
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


  server.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, user");
    
    if(req.method == 'OPTIONS'){
      res.send();
      return;
    }
    
    next();
  });

  

  



  server.use(function (req, res, next) {
    if (req.url.indexOf('.manifest') != -1) {
      res.header('Content-Type', 'text/cache-manifest');
      res.header('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT');
      next();
      return;
    }

    if (req.url.match(/(.png|.jpg|.jpeg|.svg|.woff|.woff2|.ttf|.otf|.eot)/)) {
      res.header('Cache-Control', 'max-age=691200');
    } else {
      res.header('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT');
    }
    next();
  });

  try {
    /// set which folders are being included in 'settings.json' -- if null do not include anything ///
    if (this.settings.PROJECT_INCLUDE_FOLDER) {
      // try{
      //   server.use(express.static(`${__dirname}/${this.settings.PROJECT_INCLUDE_FOLDER}`));
      // }
      // catch(e){
      //   glib.serverlog(`Failed to include project directory : ${__dirname}/${this.settings.PROJECT_INCLUDE_FOLDER}`, 0);
      // }
    }
    console.log(__dirname)
    server.use('/assets', express.static(__dirname + '/' + 'assets'));

    let views = await glib.readJSONfile("./views.json");
    try { views = JSON.parse(views) }
    catch (err) { };

    for (let path in views) {
      let view = views[path];

      server.get(view.endpoint, function (req, res) {
        urls.setupViewResponse(view, res);
      });
    }
  }
  catch (err) {
    glib.serverlog("Failed to setup views ", 0);
    glib.serverlog(err, 0);
  }

  //// set the limit in 'settings.json' -- if null do not configure it ///
  server.use(bodyParser.json({ limit: '20mb' }));
  server.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

  // configure all accepted requests //
  urls.registerRequestServices(server);

  http.listen(port, function () {
    glib.log("startup: server started @ port " + port);
    // glib.log("MEMORY END-INIT: "+util.inspect(process.memoryUsage()));
  });

}

////////////////////////////////////////////////////////////
// APP: Init process monitor
////////////////////////////////////////////////////////////
exports.monitorInit = function () {
  exports.procMon = null;
  app.procMon = new Monitor({ probeClass: 'Process' });
  app.procMon.connect();
}

////////////////////////////////////////////
app.startup(process.argv);


