import Router from "./router.js";
import API from "./services/api.js";


(() => {
    var router = new Router();
    var api = new API();

    window.router = router;

    $('.footer-child').off('click').on('click', function(){
        let route = $(this).attr('route');

        window.router.navigate(route);
    });

    window.onhashchange = () => {
        debugger;
    }

    api.get('courts').then(shops => {
        debugger
    })
})();