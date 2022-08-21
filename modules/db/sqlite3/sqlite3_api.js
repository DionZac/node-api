var dblib = require('../dblib.js');
var glib = require('../../../glib.js');


class sqlite3API {
    constructor(model) {
        this.model = model;
        this.name = model.name;

        return this;
    }

    get(id) {
        if (!id) id = -1;
        return new Promise((resolve, reject) => {
            db.engine.read(this.model, id, (err, rows) => {
                if (err) { reject(err); return; }
                else { resolve(rows); return; }
            })
        })
    }

    query(fields, values) {
        return new Promise((resolve, reject) => {
            db.engine.query(this.model, fields, values, (err, rows) => {
                if (err) { glib.serverlog('Error on query database record from table : ' + this.model['name'] + '<br> Error : ' + JSON.stringify(err), 0); reject(err); return; }
                else { resolve(rows); return; }
            })
        })
    }

    /** ====================================  CUSTOM DATABASE QUERY **************************** // 
     * @param {*} sql [String] -- SQL Query string 
     * @param {*} sql_data [Array] ---- SQL Data  (optional)
     */
    customQuery(sql, sql_data) {
        if (!sql_data) sql_data = [];

        return new Promise((resolve, reject) => {
            db.engine.customQuery(this.model, sql, sql_data)
                .then(rows => resolve(rows))
                .catch(err => reject(err));
        })
    }

    /** ===================================== DATABASE INSERT QUERY **************************** //
     * @param {*} rec [Object] -- JSON "record" object
    **/
    insert(rec) {
        try {
            rec = dblib.newRecord(this.model, rec);
        }
        catch (err) {
            throw err;
        }

        return new Promise((resolve, reject) => {
            db.engine.insert(this.model, rec, (err, rowid) => {
                if (err) { reject(err); return; }
                else { resolve(rowid); return; }
            })
        })
    }

    /** ======================================= DATABASE UPDATE QUERY ************************** //
     * @param {*} rec [Object] -- JSON "record" object
     *  ----- Note    : Must contain 'rowid' attribute --------- 
     *  ----- Note #2 : Updates ONLY the key-values the given object has -- the rest field stays the same /////
     */
    update(rec) {
        return new Promise((resolve, reject) => {
            dblib.updateRecord(this.model, rec, rec.rowid, (record) => {
                db.engine.update(this.model, record, (err) => {
                    if (err) { reject(err); return; }
                    else { resolve(); return; }
                })
            })
        })
    }

    remove(rowid) {
        return new Promise((resolve, reject) => {
            db.engine.remove(this.model, rowid, (err) => {
                if (err) { glib.serverlog('Error on remove database record from table : ' + this.model[name] + '<br> Error : ' + JSON.stringify(err), 0); reject(err); return; }
                else { resolve(); return; }
            })
        })
    }


    addcolumn(column) {
        return new Promise((resolve, reject) => {
            db.engine.alter(this.model, 0, column, (err) => {
                if (err) { glib.serverlog('Database : Add Column Failed -> ' + JSON.stringify(err), 0); reject(err); return; }
                resolve();
            })
        })
    }

    updatecolumn(column) {
        return new Promise((resolve, reject) => {
            db.engine.alter(this.model, 1, column, (err) => {
                if (err) { glib.serverlog('Database: Update column failed -> ' + JSON.stringify(err), 0); reject(err); return; }
                resolve();
            })
        })
    }

    removecolumn(column) {
        return new Promise((resolve, reject) => {
            db.engine.alter(this.model, 2, column, (err) => {
                if (err) { glib.serverlog('Database : Remove column Failed -> ' + JSON.stringify(err), 0); reject(err); return; }
                resolve();
            })
        })
    }


    // DATABASE TRANSACTIONS //
    begin() {
        return new Promise((resolve, reject) => {
            let query = 'BEGIN TRANSACTION;';
            db.engine.customQuery(this.model, query, [])
                .then(rows => resolve(rows))
                .catch(err => {
                    glib.serverlog('Error on begin transaction : ' + this.model, 0);
                    reject(err);
                });
        })
    }

    end() {
        return new Promise((resolve, reject) => {
            let query = 'END;';
            db.engine.customQuery(this.model, query, [])
                .then(rows => resolve(rows))
                .catch(err => {
                    glib.serverlog('Error on END transaction :  ' + this.model, 0);
                    reject(err);
                });
        })
    }

    rollback() {
        return new Promise((resolve, reject) => {
            let query = 'ROLLBACK;'
            db.engine.customQuery(this.model, query, [])
                .then(rows => resolve(rows))
                .catch(err => {
                    glib.serverlog('Error on ROLLBACK -> SQL transaction : ' + this.model, 0);
                    reject(err);
                });
        })
    }

    commit() {
        return new Promise((resolve, reject) => {
            let query = 'COMMIT;'
            db.engine.customQuery(this.model, query, [])
                .then(rows => resolve(rows))
                .catch(err => {
                    glib.serverlog('Error on COMMIT -> SQL transaction : ' + this.model, 0);
                    reject(err);
                });
        })
    }

    limit(index) {
        return new Promise((resolve, reject) => {
            db.engine.limit(this.model, index, (err, rows) => {
                if (err) { reject(err); return; }
                else { resolve(rows); return; }
            })
        })
    }

    filter(fields) {
        if (glib.objectIsEmpty(fields)) throw new Error('Empty object given. Cannot filterBy nothing.');
        return new Promise((resolve, reject) => {
            let out = 'SELECT rowid,* FROM ' + this.name + ' WHERE ';
            let first_field = true;
            for (var field in fields) {
                // add exceptions (i.e. 'limit' will be handled after the loop ends)
                if (!first_field && field !== 'limit') out += ' AND ';

                if (field.indexOf('contains__') > -1) {
                    field = field.split('contains__')[1];
                    out += field + ' LIKE "%' + fields['contains__' + field] + '%"';
                }
                else if (field.indexOf('startswith__') > -1) {
                    field = field.split('startswith__')[1];
                    out += field + ' LIKE "' + fields['startswith__' + field] + '%"';
                }
                else if (field.indexOf('endswith__') > -1) {
                    field = field.split('endswidth__')[1];
                    out += field + ' LIKE "%' + fields['endswith__' + field] + '"';
                }
                else if (field.indexOf('__gte') > -1) {
                    field = field.split('__gte')[0];
                    out += field + '>=' + fields[field + '__gte'];
                }
                else if (field.indexOf('__lte') > -1) {
                    field = field.split('__lte')[0];
                    out += field + '<=' + fields[field + '__lte'];
                }
                else if (field.indexOf('__gt') > -1) {
                    field = field.split('__gt')[0];
                    out += field + '>' + fields[field + '__gt'];
                }
                else if (field.indexOf('__lt') > -1) {
                    field = field.split('__lt')[0];
                    out += field + '<' + fields[field + '__lt'];
                }
                else if (field.indexOf('__between') > -1) {
                    var values = fields[field];
                    if (!Array.isArray(values) || values.length < 2) throw new Error("Between given but no array or small array given as value");
                    field = field.split('__between')[0];
                    out += field + ' BETWEEN ';
                    if (typeof (values[0] == "string" && typeof (values[1]) == "string")) {
                        out += '"' + values[0] + '" AND "' + values[1] + '"';
                    }
                    else out += values[0] + ' AND ' + values[1];
                }
                else if (field == 'limit') {
                    continue;
                }
                else {
                    out += field + '=';
                    if (typeof (fields[field]) == 'string') {
                        /// check for string value to add quotes 
                        out += '"' + fields[field] + '"';
                    }
                    else out += fields[field];
                }

                first_field = false;
            }

            if ('limit' in fields) {
                out += ' LIMIT ' + parseInt(fields['limit'])
            }

            db.engine.customQuery(this.model, out, [])
                .then(rows => resolve(rows))
                .catch(err => reject(err));


        })
    }

    between(config) {
        const generateQuery = (out, config) => {
            /// function to generate query with given date values ////
            out += ' WHERE ' + config.field + ' BETWEEN ';
            out += '"' + config.values[0] + '"';
            for (let i = 1; i < config.values.length; i++) {
                out += ' AND ';
                out += '"' + config.values[i] + '"';
            }

            return out;
        }

        return new Promise((resolve, reject) => {
            // Validate configuration for "between" query search //
            if (!('field' in config) || !('values' in config) || config.values.length < 2) { throw 'Invalid configuration object given for "BETWEEN" database query.'; }

            let out = '';
            if ('return' in config) {
                try {
                    out = 'SELECT rowid';

                    //// return only specific fields ////
                    for (let i = 0; i < config.return.length; i++) {
                        out += ',';
                        out += config.return[i];
                    }
                    out += ' FROM ' + this.name;
                    out = generateQuery(out, config);
                }
                catch (err) {
                    throw 'Invalid configuration field : "return" must be an array';
                }
            }
            else {
                out = 'SELECT rowid,* FROM ' + this.name;
                out = generateQuery(out, config);
            }

            db.engine.customQuery(this.model, out, [])
                .then(rows => resolve(rows))
                .catch(err => reject(err));

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
     filterBy(config, out) {
        return new Promise((resolve, reject) => {
            if (!out) var out = 'SELECT rowid,* FROM ' + this.name + ' WHERE';

            if ('queryset' in config) {
                var length = config.queryset.length;
                if (length > 1) {
                    out += ' (';
                    for (var i = 0; i < config.queryset.length; i++) {
                        if (i == 0) {
                            out += config.queryset[i].field;
                            switch (config.queryset[i].condition) {
                                case 'gte':
                                    out += ' >= ';
                                    break;
                                case 'gt':
                                    out += ' > ';
                                    break;
                                case 'eq':
                                    out += ' = ';
                                    break;
                                case 'lt':
                                    out += ' < ';
                                case 'lte':
                                    out += ' <= ';
                                    break;
                                default:
                                    throw new Error("Invalid or missing condition for value");
                            }

                            if (config.queryset[i].condition == 'btw') {
                                try {
                                    out += ' BETWEEN "' + config.queryset[i].value[0] + '"';
                                    out += ' AND "' + config.queryset[i].value[1] + '"';
                                }
                                catch (err) {
                                    throw 'Invalid configuration file for BETWEEN query.';
                                }
                            }
                            else out += config.queryset[i].value;
                        }
                        else {
                            out += ' ' + config.queryset[i].operation + ' ';

                            out += config.queryset[i].field;
                            switch (config.queryset[i].condition) {
                                case 'gte':
                                    out += ' >= ';
                                    break;
                                case 'gt':
                                    out += ' > ';
                                    break;
                                case 'eq':
                                    out += ' = ';
                                    break;
                                case 'lt':
                                    out += ' < ';
                                    break;
                                case 'lte':
                                    out += '<= ';
                                    break;
                                default:
                                    throw new Error("Invalid or missing condition for value");
                            }

                            if (config.queryset[i].condition == 'btw') {
                                try {
                                    out += ' BETWEEN "' + config.queryset[i].value[0] + '"';
                                    out += ' AND "' + config.queryset[i].value[1] + '"';
                                }
                                catch (err) {
                                    throw 'Invalid configuration file for BETWEEN query';
                                }
                            }
                            else out += config.queryset[i].value;

                            if (config.queryset[i + 1]) {

                            }
                            else {
                                out += ');';
                            }
                        }
                    }
                }
            }

            db.engine.customQuery(this.model, out, [])
                .then(rows => resolve(rows))
                .catch(err => reject(err));
        })
    }
}

module.exports = sqlite3API;