    exports.migration = {
        operations:[
 {
    "type": "add_field",
    "dbname": "bets",
    "field": {
        "fname": "account_uid",
        "type": "str",
        "len": 160,
        "def": "91w4brrj7r",
        "hlp": "Account UUID"
    }
},{
    "type": "add_field",
    "dbname": "live",
    "field": {
        "fname": "account_uid",
        "type": "str",
        "len": 160,
        "def": "91w4brrj7r",
        "hlp": "Account UUID"
    }
},{
    "type": "add_field",
    "dbname": "singles",
    "field": {
        "fname": "account_uid",
        "type": "str",
        "len": 160,
        "def": "91w4brrj7r",
        "hlp": "Account UUID"
    }
},]}