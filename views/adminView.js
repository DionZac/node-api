const glib = require('../glib.js');

class adminView {
    constructor(options){
        if(!options){
            glib.serverlog("View initialization - missing options", 0);
            return;
        }
        
        this.view = options;
    }

    render(template,res){
        res.sendFile(template);
    }
}

module.exports = adminView;