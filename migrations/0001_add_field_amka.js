    exports.migration = {
        operations:[
 {
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "amka",
        "type": "str",
        "def": "",
        "hlp": "AMKA number of patient"
    }
},{
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "firstname",
        "type": "str",
        "def": ""
    }
},{
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "lastname",
        "type": "str",
        "def": ""
    }
},{
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "phone_number",
        "type": "str",
        "def": ""
    }
},{
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "email",
        "type": "str",
        "def": ""
    }
},{
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "pitcture",
        "type": "str",
        "def": ""
    }
},{
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "area",
        "type": "str",
        "def": ""
    }
},{
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "notes",
        "type": "str",
        "len": 9192,
        "def": ""
    }
},{
    "type": "add_field",
    "dbname": "patients",
    "field": {
        "fname": "user",
        "type": "lnk",
        "dblink": "users",
        "def": -1,
        "hlp": "Rowid value of user(doctor) this patient is registered from"
    }
},]}