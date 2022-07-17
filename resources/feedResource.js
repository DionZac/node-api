var glib = require("../glib.js");
var master = require("./master.js");

exports.feedResource = class extends master.masterResource {
    constructor() {
        super();
        this.feed = db.feed;

        this.Meta = {
            AUTHORIZATION_CLASS: [
                'feedAuthorization'
            ],
            allowed_methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            SAFE_AUTH_METHODS:['GET', 'POST','PUT']
        }

        this.private_fields = [
            'token'
        ]

        super.initialize(this.feed);
    }
}
