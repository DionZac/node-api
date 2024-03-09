    exports.migration = {
        operations:[
 {
    "type": "update_field",
    "dbname": "courts",
    "field": {
        "fname": "shop_id",
        "type": "lnk",
        "dblink": "shops",
        "len": 160,
        "def": -1,
        "hlp": "Shop Id Link"
    }
},]}