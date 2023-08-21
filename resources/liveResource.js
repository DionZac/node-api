    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.liveResource = class extends master.masterResource {
        account_authorization = true;
        
        constructor(){
            super();
            this.live = db.live;
            super.initialize(this.live);
        }
        
        __authorize__(self){
            // authorization for all requests of live
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }

        async __insert__(self, params){
            let bet = params.bet;

            bet.account_uid = self.req.user_uid;
            bet.month = params.month;
            bet.bet_type = 2;

            try{
                let id = await db.bets.insert(bet);

                params.bet = id;
                params.account_uid = self.req.user_uid;
                await this.db.insert(params);

                self.res.send('OK');
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
                    bet.bet_type = 2;
                    bet.account_uid = self.req.user_uid;
                    if(!bet.rowid){
                        // This is a new BET record //
                        let id = await db.bets.insert(bet);
                        params.bet = id;

                        await this.db.update(params);
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
    