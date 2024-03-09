    exports.migration = {
        operations:[
 {
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "name",
        "type": "str",
        "len": 3200,
        "def": "",
        "hlp": "Shop Name"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "location",
        "type": "str",
        "len": 320,
        "def": "",
        "hlp": "Location coordinates"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "location_name",
        "type": "str",
        "len": 160,
        "def": "",
        "hlp": "Location Name"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "available_hours",
        "type": "str",
        "len": 3200,
        "def": "{'mon': '08:00 - 00:00','tue': '08:00 - 00:00', 'wed': '08:00 - 00:00', 'thu': '08:00 - 00:00', 'fri': '08:00 - 00:00', 'sat': '08:00 - 00:00', 'sun': '08:00 - 00:00'}",
        "hlp": "Object with available hours of shop"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "min_price",
        "type": "amt",
        "len": 160,
        "def": 0,
        "hlp": "Minimum Price Per/Hour"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "image_url",
        "type": "str",
        "len": 160,
        "def": "",
        "hlp": "Main Image URL"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "racket_price",
        "type": "amt",
        "len": 160,
        "def": 0,
        "hlp": "Racket Price"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "balls_price",
        "type": "amt",
        "len": 160,
        "def": 0,
        "hlp": "Balls rack price"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "commission_rate",
        "type": "amt",
        "len": 160,
        "def": 0,
        "hlp": "Commission rate percentage"
    }
},{
    "type": "add_field",
    "dbname": "shops",
    "field": {
        "fname": "cover_commisions",
        "type": "f",
        "len": 160,
        "def": "",
        "hlp": "Boolean attribute - Cover Commissions"
    }
},]}