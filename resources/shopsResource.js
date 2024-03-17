    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.shopsResource = class extends master.masterResource {
        constructor(){
            super();
            this.shops = db.shops;
            super.initialize(this.shops);
        }
        
        __authorize__(self){
            // authorization for all requests of shops
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }

        async __get__(self, params, kwargs){
            var shops = await super.__get__(self,params,kwargs);
            
            for(let shop of shops){
                try{
                    shop.courts = await db.courts.filter({shop_id: shop.rowid});
                    for(let court of shop.courts){
                        if(court.shop_id){
                            court.shop_id = court.shop_id.rowid;
                        }
                    }
                }
                catch(e){
                    console.log('Failed to load shop courts ---- Reason : ' );
                    console.log(e);
                }
            }
            return shops;
        }

        deserialize_available_hours(available_hours){
            try{
                return JSON.parse(available_hours);
            }
            catch(e){
                return available_hours;
            }
        }

        async serialize(shop){
            if(!('available_hours' in shop)){
                shop.available_hours = JSON.stringify({
                    mon:"08:00 - 00:00",
                    tue:"08:00 - 00:00",
                    wed:"08:00 - 00:00",
                    thu:"08:00 - 00:00",
                    fri:"08:00 - 00:00",
                    sat:"08:00 - 00:00",
                    sun:"08:00 - 00:00"
                })
            }

            return shop;
        }
    }
    