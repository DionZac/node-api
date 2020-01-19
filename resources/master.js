var dbs = require('../dbs.js');
var glib = require('../glib.js');


exports.masterResource = class {
    constructor(){
        this.Meta = {
            allowed_methods : ['GET', 'POST', 'PUT', 'DELETE']
        }
    }

    initialize(database){
        this.db = database;
        let temp = this.db.db; /// temporary database configuration object ///
        
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


    // ************************************* AUTHORIZE REQUEST ************************ //
    __authorize__(self){
        let params = glib.getRequestParams(self.req);
        console.log('Authorizing request....');
        return true;
    }

    __token_authorization__(self){
        let params = glib.getRequestParams(self.req);
        if(!('token' in params)){
            console.log('No token in request');
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
        console.log('Error : ' , err);
        res.send(err);
    }

    // Check for rowid //
    __check_rowid__(res,kwargs, err){
        if(!('rowid' in kwargs) || kwargs.rowid < 0){
            let msg;
            if(err) msg = err;
            else msg = 'Invalid rowid given';

            console.log(msg);
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
            // if(id == -1) var t = await this.db.get();
            // else var t = await this.db.filter({rowid:id});

            console.log('Success');
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
            console.log('Success');
            res.send('OK');

        }
        catch(err){
            console.log('Error');
            console.log(err);
            // console.log(err);
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
            console.log('Success');
            res.send(t);
        }
        catch(err){
            console.log('Error');
            // console.log(err);
            res.send(err)
        }
        
    }

    async __insert__(self,params){
        console.log(params);
        let res = self.res;
        try{
            let record = dbs.newRecord(this.db.db,params);
            await this.db.insert(record);
            console.log('Success');
            res.send({err:0});
        }
        catch(err){
            console.log('Error');
            // console.log(err);
            this.__handle_error__(res,err);
        }
    }

    async __remove__(self,params, kwargs){
        let res = self.res;
        try{
            await this.db.remove(kwargs.rowid);
            console.log('Success');
            res.send('OK');
        }
        catch(err){
            console.log('Error');
            // console.log(err);
            res.send(err);
        }
    }

    
}