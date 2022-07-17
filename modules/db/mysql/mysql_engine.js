var mysql = require('mysql');

class mysqlEngine {
    mysql;
    connection = false; // Flag if database connection is initialized

    dbname = "apidb"; // Move this in the settins file later...

    constructor() {

    }

    connect(file) {
        return new Promise((resolve,reject) => {
            try{
                this.mysql = mysql.createConnection(file);
                this.mysql.connect((err) => {
                    if(err) { 
                        this.mysql.end();
                        this.mysql = null;
                        reject(err);
                        return;
                    }

                    let cmd = "USE " + this.dbname;
                    this.mysql.query(cmd, (_err) => {
                        if(_err){
                            reject(_err);
                            return;
                        }

                        glib.dblog(`Database: Connect "OK"`, 1);
                        resolve();
                    })
                })
            }
            catch(err){
                reject(err);
            };
        })
    }
}

module.exports = mysqlEngine;