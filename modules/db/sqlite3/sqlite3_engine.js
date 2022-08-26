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
            let foreign = '';
            let query = `CREATE TABLE ${dbf.name} (`;
            for (let [idx, field] of dbf.fields.entries()) {
                if (idx) query += ',';
                if (field.size && field.size > 1) {
                    for (let j = 0; j < field.size; j++) {
                        if (j > 0) query += ',';

                        let temp_field = JSON.parse(JSON.stringify(field));
                        temp_field.fname = `${field.fname}_${j}`;
                        query += dblib.outputField(temp_field, -1);

                        if (field.type == "lnk") {
                            if (!field.dblink || !db[field.dblink]) {
                                // Fail safe for bad dblink value //
                                field.type = "i32";
                                continue;
                            }
                            if (foreign !== '') foreign += ',';
                            foreign += `FOREIGN KEY(${temp_field.fname}) REFERENCES ${field.dblink}(rowid)`;
                        }
                    }
                }
                else {
                    query += dblib.outputField(field, -1);
                    if (field.type == "lnk") {
                        if (!field.dblink || !db[field.dblink]) {
                            // Fail safe for bad dblink value //
                            field.type = "i32";
                            continue;
                        }
                        if (foreign !== '') foreign += ',';
                        foreign += `FOREIGN KEY(${field.fname}) REFERENCES ${field.dblink}(rowid)`;
                    }
                }
            }

            if (foreign !== '') query += ',' + foreign;
            query += ')';

            let drop_query = `DROP TABLE IF EXISTS ${dbf.name}`;
            glib.dblog(drop_query, 2);

            this.sqlite3.run(drop_query, () => {
                glib.dblog(query, 2);

                this.sqlite3.run(query, callback);
            })
        }
        catch (err) {
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
            let query = `UPDATE ${dbf.name} SET `;

            let idx = 0;
            for(let f in rec){
                if(f == "rowid") continue;

                if(idx) query += ',';

                let field;
                for(let _f of dbf.fields){
                    if(_f.fname == f) field = _f;
                    if(_f.size && _f.size > 1){
                        for(let i=0; i<_f.size; i++){
                            if(`${_f.fname}_${i}` == f) field = _f;
                        }
                    }
                }

                let value = rec[f];
                let temp = JSON.parse(JSON.stringify(field));
                temp.fname = f;
                query += fieldOutput(temp, value);

                idx ++;
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
                if (field.size && field.size > 1) {
                    for (let j = 0; j < field.size; j++) {
                        if (j > 0) query += ',';

                        query += `${field.fname}_${j}`;
                    }
                }
                else {
                    query += field.fname;
                }
            }

            query += `) VALUES (`;

            for (let [idx, field] of dbf.fields.entries()) {
                if (idx) query += ',';

                if (field.size && field.size > 1) {
                    for (let j = 0; j < field.size; j++) {
                        if (j > 0) query += ',';

                        let value = rec[`${field.fname}_${j}`];
                        query += fieldOutput(field, value);
                    }
                }
                else {
                    let value = rec[field.fname];
                    query += fieldOutput(field, value);
                }
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
            this.sqlite3.all(query, (err, rows) => {
                this.callbackInjection(dbf, err, rows, callback);
            });
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
            this.sqlite3.all(query, (err, rows) => {
                this.callbackInjection(dbf, err, rows, callback);
            });
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
            this.sqlite3.all(query, values, (err, rows) => {
                this.callbackInjection(dbf, err, rows, callback);
            });
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
                    this.callbackInjection(dbf, err, rows, function(_err, _rows){
                        if (_err) reject(_err);
                        else resolve(_rows);
                    })
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

                    const alterTableAddColumn = (f) => {
                        let query = `ALTER TABLE ${dbf.name} ADD COLUMN `;
                        query += dblib.outputField(f, -1);

                        if('def' in f) query += ` DEFAULT "${f.def}"`;

                        return new Promise((resolve, reject) => {
                            glib.dblog(query)
                            this.sqlite3.run(query, (err) => {
                                if(err){
                                    glib.dblog(err, 2);
                                    reject(err)
                                }
                                else resolve();
                            })
                        })
                    }

                    let hasNewForeignKeyFields = false;
                    if(column.size && column.size > 1){
                        for(let i=0; i<column.size; i++){
                            let _fname = `${column.fname}_${i}`;
                            if(column.type == "lnk"){
                                if(!column.dblink || !db[column.dblink]){
                                    column.type = "i32";
                                }
                                else{
                                    hasNewForeignKeyFields = true;
                                }
                            }

                            let temp = JSON.parse(JSON.stringify(column));
                            temp.fname = _fname;
                            await alterTableAddColumn(temp);
                        }
                    }
                    else{
                        if(column.type == "lnk"){
                            if(!column.dblink || !db[column.dblink]){
                                column.type = "i32";
                            }
                            else{
                                hasNewForeignKeyFields = true;
                            }
                        }
                        
                        await alterTableAddColumn(column);
                    }

                    if(hasNewForeignKeyFields){
                        try{
                            await this.begin();

                            // Clone database table //
                            var temp = JSON.parse(JSON.stringify(dbf)); // hard-clone objcet 
                            temp['name'] = `__${dbf.name}_backup__`;

                            //// ## CREATE THE BACKUP TABLE ////
                            this.create(temp, async (err) => {
                                if (err) throw err;

                                // ## INSERT RECORDS TO BACKUP TABLE ## //
                                let q = 'INSERT INTO ' + temp['name'] + ' SELECT';
                                for (let f of temp.fields) {
                                    if(f.size && f.size > 0){
                                        for(let i=0; i<f.size; i++){
                                            q += ` ${f.fname}_${i},`;
                                        }
                                    }
                                    else{
                                        q += ` ${f.fname},`;
                                    }
                                }
                                q = q.substr(0, q.length - 1); /// remove the ',' 
                                q += ' FROM ' + dbf.name + ';';
                                await this.customQuery(dbf, q, []);

                                // ## DROP OLD DATABASE TABLE ///
                                let drop = 'DROP TABLE ' + dbf.name + ';';
                                await this.customQuery(dbf, drop, []);

                                // ## RENAME THE BACKUP TABLE ///
                                let rename = 'ALTER TABLE ' + temp['name'] + ' RENAME TO ' + dbf.name + ';';
                                await this.customQuery(dbf, rename, []);

                                // ## COMMIT THE SQL QUERIES ///
                                await this.commit();

                                callback();
                            });
                        }
                        catch(err){
                            this.rollback();
                            glib.dblib(err, 2);
                        }
                    }
                    else{
                        callback();
                    }
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

                    // let field_to_remove;
                    // for(let field of dbf.fields){
                    //     if(field.fname == column.fname){
                    //         field_to_remove = field;
                    //     }
                    // }

                    // if(!field_to_remove){
                    //     callback('Could not find field to remove : ' + column.fname);
                    //     return;
                    // }

                    /// ## REMOVE THE COLUMN FROM database SCHEMA ////
                    var temp = JSON.parse(JSON.stringify(dbf));
                    temp['name'] = '__' + dbf.name + '__';
                    for (let i = 0; i < temp.fields.length; i++) {
                        let f = temp.fields[i];
                        if (f.fname == column.fname){
                            temp.fields.splice(i, 1);
                        }
                    }

                    //// ## CREATE THE BACKUP TABLE ////
                    this.create(temp, async (err) => {
                        if (err) throw err;

                        // ## INSERT RECORDS TO BACKUP TABLE ## //
                        let q = 'INSERT INTO ' + temp['name'] + ' SELECT';
                        for (let f of temp.fields) {
                            if(f.size && f.size > 1){
                                for(let j=0; j<f.size; j++){
                                    q += ` ${f.fname}_${j} ,`;
                                }
                            }
                            else{
                                q += ' ' + f.fname + ',';
                            }
                        }
                        q = q.substr(0, q.length - 1); /// remove the ',' 
                        q += ' FROM ' + dbf.name + ';';
                        await this.customQuery(dbf, q, []);

                        // ## DROP OLD DATABASE TABLE ///
                        let drop = 'DROP TABLE ' + dbf.name + ';';
                        await this.customQuery(dbf, drop, []);

                        // ## RENAME THE BACKUP TABLE ///
                        let rename = 'ALTER TABLE ' + temp['name'] + ' RENAME TO ' + dbf.name + ';';
                        await this.customQuery(dbf, rename, []);

                        // ## COMMIT THE SQL QUERIES ///
                        let commit = 'COMMIT';
                        await this.customQuery(dbf, commit, []);

                        callback();
                    });

                    break;
                default:
                    callback('Invalid Operation');
                    return;
            }
        }
        catch (e) {
            handle_transaction_error();
            callback(e);
            return;
        }
    }

    /**
     * SQLITE3 Engine : "BEGIN TRANSACTION"
     */
    begin(callback) {
        if (!callback) { callback = function () { }; };

        return new Promise((resolve, reject) => {
            try {
                let query = 'BEGIN TRANSACTION;';
                glib.dblog(query, 2);
                this.sqlite3.all(query, function () {
                    callback();
                    resolve();
                })
            }
            catch (e) {
                reject(e);
            }
        })
    }

    /**
     * SQLITE3 Engine : "ROLLBACK"
     */
    rollback(callback) {
        if (!callback) { callback = function () { }; };

        return new Promise((resolve, reject) => {
            try {
                let query = 'ROLLBACK;';
                glib.dblog(query, 2);
                this.sqlite3.all(query, function () {
                    callback();
                    resolve();
                })
            }
            catch (e) {
                reject(e);
            }
        })
    }

    /**
     * SQLITE3 Engine : "COMMIT"
     */
    commit(callback) {
        if (!callback) { callback = function () { }; };

        return new Promise((resolve, reject) => {
            try {
                let query = 'COMMIT;';
                glib.dblog(query, 2);
                this.sqlite3.all(query, function () {
                    callback();
                    resolve();
                })
            }
            catch (e) {
                reject(e);
            }
        })
    }


    async callbackInjection(model, err, rows, callback){
        let out = [];

        if(model && rows){
            for(let row of rows){
                let record = {rowid: row.rowid};

                for(let field of model.fields){
                    if(field.type == "lnk"){
                        if(field.size && field.size > 1){
                            for(let i=0; i<field.size; i++){
                                let fname = `${field.fname}_${i}`;
                                let dbname = field.dblink;
                                if(row[fname]){
                                    try{
                                        let nested_record = await db[dbname].get(row[fname]);
                                        record[fname] = nested_record[0];
                                    }
                                    catch(e){
                                        record[fname] = null;
                                    }
                                }
                            }
                        }
                        else{
                            if(row[field.fname]){
                                let dbname = field.dblink;
                                try{
                                    let nested_record = await db[dbname].get(row[field.fname]);
                                    record[field.fname] = nested_record[0];
                                }
                                catch(e){
                                    record[field.fname] = null;
                                }
                            }
                            else{
                                record[field.fname] = row[field.fname];
                            }
                        }
                    }
                    else{
                        record[field.fname] = row[field.fname];
                    }
                }

                console.log('Record ----> ' + JSON.stringify(record));
                out.push(record);
            }
        }
        else{
            out = rows;
        }

        if(callback){
            callback(err, out);
        }
    }

}

module.exports = sqlite3Engine;