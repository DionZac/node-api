    exports.migration = {
        operations:[
 {
    "type": "add_field",
    "dbname": "connections",
    "field": {
        "fname": "profile_1",
        "type": "lnk",
        "dblink": "profile",
        "len": 160,
        "def": -1,
        "hlp": "Link ID of profiles database"
    }
},{
    "type": "add_field",
    "dbname": "connections",
    "field": {
        "fname": "profile_2",
        "type": "lnk",
        "dblink": "profile",
        "len": 160,
        "def": -1,
        "hlp": "Link ID of profiles database"
    }
},{
    "type": "add_field",
    "dbname": "connections",
    "field": {
        "fname": "status",
        "type": "str",
        "len": 160,
        "def": "pending_2",
        "hlp": "Status of connection - pending_1 | pending_2 | confirmed"
    }
},]}