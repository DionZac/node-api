    exports.migration = {
        operations:[
 {
    "type": "add_field",
    "dbname": "profile",
    "field": {
        "fname": "name",
        "type": "str",
        "len": 3200,
        "def": "",
        "hlp": "Profile Name"
    }
},{
    "type": "add_field",
    "dbname": "profile",
    "field": {
        "fname": "date_created",
        "type": "str",
        "len": 160,
        "def": "11-03-2024",
        "hlp": "Profile Date Created"
    }
},{
    "type": "add_field",
    "dbname": "profile",
    "field": {
        "fname": "ranking_points",
        "type": "amt",
        "len": 160,
        "def": 0,
        "hlp": "Profile Ranking Points"
    }
},{
    "type": "add_field",
    "dbname": "profile",
    "field": {
        "fname": "image_url",
        "type": "str",
        "len": 3200,
        "def": "",
        "hlp": "Profile Name"
    }
},]}