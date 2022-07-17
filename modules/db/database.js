var glib = require("../../glib.js");

class database {
    settings = {};
    
    objects = {}; // Reference to all of the Database Tables as "objects"

    engine; // Reference to the Database Engine Instance -- Handles the actual db queries

    constructor() {
        this.engineSetup();
    }

    /**
     * Initialize database connection *
     */
    async init() {
        glib.dblog(`Database: Initializing database (engine \" ${this.settings.DB_ENGINE}\")`, 3);

        // Setup the Objects based on the model files //
        let dbfiles = await glib.loadModelFiles();
        for(let dbfile in dbfiles) {
            let dbobject = dbfiles[dbfile];
            try{ dbobject = JSON.parse(dbobject)}
            catch(e){}

            for(let dbentry in dbobject){
                let model = dbobject[dbentry];
                this.objects[dbentry] = model;

                // For every model , a new API will be created //
                this[dbentry] = this.apiSetup(model);
            }
        }
    }

    /**
     * Setting up the reference to the proper API based on the DB_ENGINE flag
     */
    apiSetup(model) {
        /// TODO: Check the seetings and initialize the proper API
        var api = require("./sqlite3/sqlite3_api.js");
        return new api(model);
    }

    /**
     * Setting up the reference to the proper engine based on the DB_ENGINE flag
     */
    engineSetup(){
        /// TODO: Check the seetings and initialize the proper Engine
        var engine = require("./sqlite3/sqlite3_engine.js");
        this.engine = new engine(this.settings.DB_FILE);
    }
}

module.exports = database;