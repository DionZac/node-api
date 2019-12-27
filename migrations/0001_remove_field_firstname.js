    exports.migration = {
        operations:[
 {
    "type": "remove_field",
    "dbname": "users",
    "field": {
        "fname": "firstname",
        "type": "str",
        "len": 160,
        "def": "Test field"
    }
},]}