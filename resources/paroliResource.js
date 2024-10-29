    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.paroliResource = class extends master.masterResource {
        account_authorization = true;
        
        constructor(){
            super();
            this.paroli = db.paroli;
            super.initialize(this.paroli);
        }
        
        __authorize__(self){
            // authorization for all requests of paroli
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }

        async __insert__(self,params){
            let bets = params.bets;
            params.account_uid = self.req.user_uid;

            try{
                let output = 1;
                let idx = 0;
                for(let bet of bets){
                    bet.account_uid = self.req.user_uid;
                    bet.month = params.month;
                    bet.bet_type = 1;
                    output *= bet.output;

                    let id = await db.bets.insert(bet);
                    params.bets[idx] = id;

                    idx ++;
                }

                params.output = output;
                let paroliId = await db.paroli.insert(params);
                self.res.send(paroliId.toString());
            }
            catch(err){
                self.res.send('Failed to insert record ----> ' + JSON.stringify(err));
            }
        }

        async __update__(self,params,kwargs){
            try{
                params.rowid = kwargs.rowid;
                params.output = 1;
                params.account_uid = self.req.user_uid;
                let bets = params.bets;
                if(bets){
                    let idx = 0;
                    for(let bet of bets){
                       bet.month = params.month;
                       bet.bet_type = 1;
                       bet.account_uid = self.req.user_uid;
                       params.output *= bet.output;

                       if(!bet.rowid){
                        // This is a new bet record //
                        let id = await db.bets.insert(bet);
                        params.bets[idx] = id;
                       }
                       else{
                        // Already existing bet //
                        params.bets[idx] = bet.rowid;
                        await db.bets.update(bet);
                       }

                       idx++;
                    }
                }

                await this.db.update(params);
                self.res.send('OK');
            }
            catch(err){
                self.res.send('Failed to update record ----> ' + JSON.stringify(err));
            }
        }
    }
    