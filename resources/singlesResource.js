    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.singlesResource = class extends master.masterResource {
        constructor(){
            super();
            this.singles = db.singles;
            super.initialize(this.singles);
        }
        
        __authorize__(self){
            // authorization for all requests of singles
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }

        async __insert__(self,params){
            let bet = params.bet;

            bet.month = params.month;
            bet.bet_type = 0;

            try{
                let id = await db.bets.insert(bet);

                params.bet = id;
                let singleId = await db.singles.insert(params);
                console.log(singleId);

                self.res.send(singleId.toString());
            }
            catch(err){
                self.res.send('Failed to insert record ----> ' + JSON.stringify(err));
            }
        }

        async __update__(self,params,kwargs){
            let res = self.res;
            try{
                params.rowid = kwargs.rowid;

                let bet = params.bet;
                if(bet){
                    bet.month = params.month;
                    bet.bet_type = 0;
                    if(!bet.rowid){
                        // This is a new BET record //
                        let id = await db.bets.insert(bet);
                        params.bet = id;

                        await db.singles.update(params);
                        res.send('OK');
                        return;
                    }
                    else{
                        // Already existing bet //
                        await db.bets.update(bet);
                        params.bet = bet.rowid;
                    }
                }

                console.log("PARAMS --------> " , params);
                await this.db.update(params);

                self.res.send('OK');
            }
            catch(err){
                self.res.send('Failed to update record ----> ' + JSON.stringify(err));
            }
        }
    }
    