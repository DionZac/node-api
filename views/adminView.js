const glib = require('../glib.js');

class adminView {
    constructor(options){
        if(!options){
            glib.serverlog("View initialization - missing options", 0);
            return;
        }
        
        this.view = options;
    }

    render(res){
        let fullpath = `${appRoot}/${Settings.PROJECT_INCLUDE_FOLDER}/${this.view.folderpath}/${this.view.filename}`;

        res.sendFile(fullpath);
    }
}

module.exports = adminView;