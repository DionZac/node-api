    exports.migration = {
        operations:[
 {
    "type": "remove_field",
    "dbname": "courts",
    "field": {
        "fname": "test",
        "type": "str",
        "len": 160,
        "def": "",
        "hlp": "Just a test field so table is not empty"
    }
},{
    "type": "add_field",
    "dbname": "courts",
    "field": {
        "fname": "name",
        "type": "str",
        "len": 160,
        "def": "Court #1",
        "hlp": "Court Name"
    }
},{
    "type": "add_field",
    "dbname": "courts",
    "field": {
        "fname": "price_per_hour",
        "type": "amt",
        "len": 160,
        "def": 0,
        "hlp": "Court Price Per Hour"
    }
},{
    "type": "add_field",
    "dbname": "courts",
    "field": {
        "fname": "outdoor",
        "type": "f",
        "len": 160,
        "def": "false",
        "hlp": "Boolean - Court Outdoor - Default false"
    }
},]}