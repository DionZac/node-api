    var glib    = require("../glib.js");
    var master  = require("./master.js");
    
    exports.connectionsResource = class extends master.masterResource {
        constructor(){
            super();
            this.connections = db.connections;
            super.initialize(this.connections);
        }
        
        __authorize__(self){
            // authorization for all requests of connections
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }

        async filter_by(self, params, kwargs){
            var filters = params.filter_by;
            var queryset= [];
            if('user' in filters){
                queryset = [
                    {
                        field:"profile_1",
                        condition: 'eq',
                        value: filters["user"]
                    },
                    {
                        field:"profile_2",
                        condition: 'eq',
                        value:filters["user"],
                        operation: "OR"
                    }
                ];
            }

            if('status' in filters){
                queryset.push({
                    field:'status',
                    condition: 'eq',
                    value: filters['status'],
                    operation: 'AND'
                });
            }

            return await this.db.filterBy({queryset: queryset});
            console.log(params);
        }
    }
    