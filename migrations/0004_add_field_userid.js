    exports.migration = {
        operations:[
 {
    "type": "add_field",
    "dbname": "test1",
    "field": {
        "fname": "userid",
        "type": "lnk",
        "dblink": "users",
        "hlp": "User Token"
    }
},]}