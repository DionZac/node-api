var glib = require('../glib.js');

exports.masterResource = class {
    constructor(){
        this.Meta = {
            allowed_methods : ['GET', 'POST', 'PUT', 'DELETE']
        }
    }

    initialize(database){
        this.db = database;
        let temp = this.db.model; /// temporary database configuration object ///
        
        if('readOnly' in temp && temp.readOnly){
            this.setReadOnly();
        }
        else if('read_write' in temp && temp.read_write){
            this.read_and_write();
        }
    }

    //// allowed to read and write in this database ////
    read_and_write(){
        this.Meta.allowed_methods = ['GET', 'POST', 'PUT'];
    }

    //// allowed only to READ from this database /////
    setReadOnly(){
        this.Meta.allowed_methods = ['GET'];
    }


    //// Error:404 (no results found) /////
    __results_not_found__(self){
        glib.serverlog('No results found', 0);
        // self.res.status(404);
        // self.res.send('No results found')
        self.res.send([]);
    }


    // ************************************* AUTHORIZE REQUEST ************************ //
    __authorize__(self){
        let params = glib.getRequestParams(self.req);
        return true;
    }

    __token_authorization__(self){
        let params = glib.getRequestParams(self.req);
        if(!('token' in params)){
            glib.serverlog('No token in request', 0);
            return false;
        }
        
        let token = params.token;
        /// find a way to compare the token given with the user session token ///

        return true;
    }

    __authorization_failed__(self, reason){
        self.res.status(401);
        if(reason) self.res.send(reason);
        else self.res.send();
        return;
    }
    


    // Handle not-allowed request-method //
    __handle_not_allowed_method__(res,msg){
        this.__handle_error__(res,msg);
    }

    // Handle no function found //
    __function_not_found__(res){
        res.send('Error : endpoint not found');
    }

    // Handle no database reference //
    __db_reference_failed__(res){
        if(!this.db){
            let msg = 'No database reference found --- response error send';
            this.__handle_error__(res,msg);
            return true;
        }
        return false;
    }

    // Handle a failed request and response a passed error message //
    __handle_error__(res, err){
        glib.serverlog(err, 0);
        res.send(err);
    }

    // Check for rowid //
    __check_rowid__(res,kwargs, err){
        if(!('rowid' in kwargs) || kwargs.rowid < 0){
            let msg;
            if(err) msg = err;
            else msg = 'Invalid rowid given';

            glib.serverlog(msg, 0);
            this.__handle_error__(res,msg);

            return false;
        }
        return true;
    }

    async __get__(self, params, kwargs){
        let res = self.res;

        if(kwargs && ('rowid' in kwargs) && kwargs.rowid > -1) var id = kwargs.rowid;
        else id = -1;

        try{
            var t = await this.db.get(id);

            if(!t || t.length == 0){
                this.__results_not_found__(self);
                return;
            }
            return t;
        }
        catch(err){
            this.__handle_error__(res,err);
        }
    }

    async __update__(self,params,kwargs){
        let res = self.res;
        try{
            params.rowid = kwargs.rowid;
            await this.db.update(params);
            res.send('OK');

        }
        catch(err){
            glib.serverlog(err);
            res.send(err);
        }
    }

    async __read__(self,params,kwargs){
        let res = self.res;
        let rowid;
        if(kwargs && 'rowid' in kwargs && kwargs.rowid > -1)  rowid = kwargs.rowid;
        else rowid = -1;

        try{
            var t = await this.db.get(rowid);

            if(!t || t.length == 0){
                this.__results_not_found__(self);
                return;
            }

            res.send(t);
        }
        catch(err){
            glib.serverlog(err,0);
            res.send(err)
        }
        
    }

    async __insert__(self,params){
        let res = self.res;
        try{
            await this.db.insert(params);
            res.send({err:0});
        }
        catch(err){
            glib.serverlog(err, 0);
            this.__handle_error__(res,err);
        }
    }

    async __remove__(self,params, kwargs){
        let res = self.res;
        try{
            await this.db.remove(kwargs.rowid);
            res.send('OK');
        }
        catch(err){
            glib.serverlog(err, 0);
            res.send(err);
        }
    }
    
}