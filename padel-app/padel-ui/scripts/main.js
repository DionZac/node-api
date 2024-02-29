import Router from "./router.js";

(() => {
    var router = new Router();

    window.router = router;

    $('.footer-child').off('click').on('click', function(){
        let route = $(this).attr('route');

        window.router.navigate(route);
    });

    window.onhashchange = () => {
        debugger;
    }
})();