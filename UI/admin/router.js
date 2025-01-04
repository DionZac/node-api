class Router {
    current = "dashboard";
    constructor(){
        return this;
    };

    openView(page){
        // View call does not exist
        if($(`#${page}`).length == 0) return;

        $(".content").hide();
        $(`#${page}`).show();

        window.views[page].show();

    }
}

export default Router;