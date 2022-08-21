var sqlite3 = require("sqlite3").verbose();
var glib = require("../../../glib.js");

var dblib = require("../dblib.js");

class sqlite3Engine {
    sqlite3;
    connection = false; // Flag if database connection is initialized

    constructor() {

    }

    connect() {
        let file = db.settings.DB_FILE;

        return new Promise((resolve, reject) => {
            this.sqlite3 = new sqlite3.Database(file, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                glib.dblog(`Database: Connect "OK"`, 1)
                this.connection = true;
                resolve();
            })
        })
    }

    /**
     * API : Create Database Table * 
    */
    create(dbf, callback) {
        if (!callback) callback = function () { };

        try {
            let query = `CREATE TABLE ${dbf.name} (`;
            for (let [idx, field] of dbf.fields.entries()) {
                if (idx) query += ',';
                query += dblib.outputField(field, -1);
            }

            query += ')';

            let drop_query = `DROP TABLE IF EXISTS ${dbf.name}`;
            glib.dblog(drop_query, 2);

            this.sqlite3.run(drop_query, () => {
                glib.dblog(query, 2);

                this.sqlite3.run(query, callback);
            })
        }
        catch (e) {
            glib.dblog('Database: Create failed : ' + JSON.stringify(err), 0);
            callback(err);
        }
    }

    /**
     * API: Update Database record ( @rec ) 
    */
    update(dbf, rec, callback) {
        if (!callback) callback = function () { };

        // Checks if field type is string to add quotes in the value //
        const fieldOutput = function (field, value) {
            if (dblib.isString(field.type)) {
                return `${field.fname}="${value}"`
            }
            return `${field.fname}=${value}`;
        }

        try {
            let query = `UPDATE ${dbf.name} `;

            for (let [idx, field] of dbf.fields.entries()) {
                if (idx) query += ',';
                let value = rec[field.fname];
                query += fieldOutput(field, value);
            }

            query += ` WHERE rowid=${rec.rowid};`;

            glib.dblog(query, 2);
            this.sqlite3.run(query, callback);
        }
        catch (err) {
            glib.dblog("Database: Update error -> " + JSON.stringify(err), 0);
            callback(err);
        }
    }

    /**
     * API: Insert Database Record ( @rec )
     */
    insert(dbf, rec, callback) {
        if (!callback) callback = function () { };

        // Checks if field type is string to add quotes in the value //
        const fieldOutput = function (field, value) {
            if (dblib.isString(field.type)) {
                return `"${value}"`;
            }
            else {
                return value;
            }
        }

        try {
            let query = `INSERT INTO ${dbf.name} (`;

            for (let [idx, field] of dbf.fields.entries()) {
                if (idx) query += ',';
                query += field.fname;
            }

            query += `) VALUES (`;

            for (let [idx, field] of dbf.fields.entries()) {
                if (idx) query += ',';
                let value = rec[field.fname];
                query += fieldOutput(field, value);
            }

            query += ');';

            glib.dblog(query, 2);
            this.sqlite3.run(query, callback);
        }
        catch (err) {
            glib.dblog("Database: Insert error -> " + JSON.stringify(err), 0);
            callback(err);
        }

    }

    /**
     * API: Read from database with "LIMIT" @limit filter *
     */
    limit(dbf, limit, callback) {
        if (!callback) callback = function () { };

        try {
            let query = `SELECT rowid, * FROM ${dbf.name} LIMIT ${limit};`;

            glib.dblog(query, 2);
            this.sqlite3.all(query, callback);
        }
        catch (err) {
            glib.dblog("Database: Limit read error -> " + JSON.stringify(err), 0);
            callback(err);
        }
    }

    /**
     * API: Read from Database table *
     * @rowid : Specific Record (Returns all records if -1)
     */
    read(dbf, rowid, callback) {
        if (!callback) callback = function () { };

        let query = `SELECT rowid, * FROM ${dbf.name}`;
        if (rowid !== -1) query += ` WHERE rowid=${rowid};`;

        try {
            glib.dblog(query, 2);
            this.sqlite3.all(query, callback);
        }
        catch (err) {
            glib.dblog("Database: Read error -> " + JSON.stringify(err), 0);
            callback(err);
        }
    }

    /**
     * API: Execute database query *
     * @columns [] -> Array of column names
     * @values [] -> Array of the values
     *  --- Must have the same order in the Array ---
     */
    query(dbf, columns, values, callback) {
        if (!callback) callback = function () { };

        try {
            let query = `SELECT rowid,* FROM ${dbf.name} WHERE `;
            for (let [idx, column] of columns.entries()) {
                if (idx) query += 'AND ';
                query += `${column}=? `;
            }

            glib.dblog(query, 2);
            this.sqlite3.all(query, values, callback);
        }
        catch (err) {
            glib.dblog("Database: Query Read error -> " + JSON.stringify(err), 0);
            callback(err);
        }
    }

    /**
     * API: Execute Custom Database Query *
     */
    customQuery(dbf, query, data) {
        return new Promise((resolve, reject) => {
            try {
                glib.dblog(query, 2);
                this.sqlite3.all(query, data, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                })
            }
            catch (e) {
                glib.dblog("Database: Custom Query failed -> " + JSON.stringify(e), 0);
                reject(e);
            }
        })
    }

    /**
     * API: Remove Record from database *
     *  @ids [] -> Array of records rowids to remove * 
    */
    remove(dbf, ids, callback) {
        if (!callback) callback = function () { };

        try {
            let query = `DELETE FROM ${dbf.name} WHERE rowid=? `;
            if (ids.length > 1) {
                for (let id of ids) query += ' OR rowid=? ';
            }

            glib.log(query, 2);
            this.sqlite3.all(query, ids, callback);
        }
        catch (e) {
            glib.dblog("Database: DELETE error -> " + JSON.stringify(err), 0);
            callback(err);
        }
    }

    /**
     * // API: ALTER TABLE
    // ====================
    //  Operation - Add column
    //    -- column : object
    //  Operation - Edit column
    //    -- column : object
    //  Operation - Remove column
    //    -- column : object (only fname:'field' attribute)
    */
    async alter(dbf, operation, column, callback) {
        if (!callback) callback = function () { };

        // ROLLBACK TRANSACTION --
        // If rollback fails - retry (max 10 times)
        var error_retries = 0;
        const handle_transaction_error = () => {
            let out = 'ROLLBACK';
            error_retries++;
            this.customQuery(dbf, out, [])
                .then(() => glib.dblog("TRANSACTION rolled-back", 1))
                .catch(err => {
                    if (error_retries < 10) handle_transaction_error();
                })
        }

        try {
            let fname = column.fname;

            switch (operation) {
                case 0:
                    // Add column //
                    var query = `ALTER TABLE ${dbf.name} ADD COLUMN `;
                    query += dblib.outputField(column, -1);

                    if ('def' in column) query += ` DEFAULT "${column.def}"`;

                    glib.dblog(query, 2);
                    this.sqlite3.run(query, callback);
                    break;
                case 1:
                    // Update column //

                    // ## START TRANSACTION ## //
                    var begin = 'BEGIN TRANSACTION';
                    await this.customQuery(dbf, begin, []);

                    // Clone database table //
                    var temp = JSON.parse(JSON.stringify(dbf)); // hard-clone objcet 
                    temp['name'] = `__${dbf.name}_backup__`;

                    this.create(temp, async (err) => {
                        if (err) throw err;

                        // ## INSERT RECORDS IN BACKUP TABLE CREATED ## //
                        var query = `INSERT INTO ${temp['name']} SELECT`;
                        for (let field of temp.fields) query += ` ${field.fname},`;
                        query = query.substr(0, query.length - 1); // remove the last comma

                        query += `FROM ${dbf.name};`;
                        await this.customQuery(dbf, query, []);

                        // ## DROP THE ORIGINAL TABLE ## //
                        let drop = `DROP TABLE ${dbf.name};`;
                        await this.customQuery(dbf, drop, []);

                        // ## RENAME THE BACKUP TABLE ## //
                        let rename = `ALTER TABLE ${temp['name']} RENAME TO ${dbf.name};`;
                        await this.customQuery(dbf, rename, []);

                        // ## COMMIT THE TRANSACTION ## //
                        let commit = 'COMMIT;';
                        await this.customQuery(dbf, commit, []);

                        callback();
                    });

                    break;
                case 2: // Remove column //

                    // Get the json schema record //
                    let json_schema = await db.json_schema.query(['tablename'], [dbf.name]);
                    dbf = glib.parseModelSchema(json_schema[0].schema)[dbf.name];

                    // ## START DATABASE TRANSACTION ## //
                    var begin = 'BEGIN TRANSACTION';
                    await this.customQuery(dbf, begin, []);

                    /// ## REMOVE THE COLUMN FROM database SCHEMA ////
                    var temp = JSON.parse(JSON.stringify(dbf));
                    temp['name'] = '__' + dbf.name + '__';
                    for (let i = 0; i < temp.fields.length; i++) if (temp.fields[i].fname == fname) temp.fields.splice(i, 1);

                    //// ## CREATE THE BACKUP TABLE ////
                    this.create(temp, async (err) => {
                        if (err) throw err;

                        // ## INSERT RECORDS TO BACKUP TABLE ## //
                        let q = 'INSERT INTO ' + temp['name'] + ' SELECT';
                        for (let f of temp.fields) q += ' ' + f.fname + ',';
                        q = q.substr(0, q.length - 1); /// remove the ',' 
                        q += ' FROM ' + dbf.name + ';';
                        await this.customQuery(dbf, q, []);

                        // ## DROP OLD DATABASE TABLE ///
                        let drop = 'DROP TABLE ' + dbf.name + ';';
                        await this.customQuery(dbf,drop,[]);

                        // ## RENAME THE BACKUP TABLE ///
                        let rename = 'ALTER TABLE ' + temp['name'] + ' RENAME TO '+ dbf.name + ';';
                        await this.customQuery(dbf,rename,[]);

                        // ## COMMIT THE SQL QUERIES ///
                        let commit = 'COMMIT';
                        await this.customQuery(dbf,commit,[]);

                        callback();
                    });
                    
                    break;
                default:
                    callback('Invalid Operation');
                    return;
            }
        }
        catch(e){
            handle_transaction_error();
            callback(e);
            return;
        }
    }
}

module.exports = sqlite3Engine;