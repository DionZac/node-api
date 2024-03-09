    exports.migration = {
        operations:[
 {
    "type": "remove_field",
    "dbname": "shops",
    "field": {
        "fname": "cover_commisions",
        "type": "f",
        "len": 160,
        "def": "",
        "hlp": "Boolean attribute - Cover Commissions"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "cover_commissions",
        "type": "f",
        "len": 160,
        "def": "",
        "hlp": "Boolean attribute - Cover Commissions"
    }
},]}