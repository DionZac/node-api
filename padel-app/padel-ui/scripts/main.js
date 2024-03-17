import Router from "./router.js";
import API from "./services/api.js";
import Profile from "./objects/profile.js";

(async () => {

    var router = new Router();
    var api = new API();

    window.api = api;
    window.router = router;

    // Initialize application - Load User Profile //
    var profile = await api.get("profile");
    let user_profile = new Profile(profile[0]);

    // Render in HTML //
    await user_profile.render();

    // Globalize Profile instance of user //
    window.user_profile = user_profile;

    // Initialize application - go to home page //
    router.navigate("home");

    // Attatch footer click events for navigation //
    $('.footer-child').off('click').on('click', function(){
        let route = $(this).attr('route');

        window.router.navigate(route);
    });
    
})();




/// API TESTS //

// await api.delete("connections", 1);
    // await api.delete("connections", 2);
    // await api.post("connections", {
    //     "profile_1": 1,
    //     "profile_2": 2,
    //     "status": "pending_2"
    // })

    // for(let i=0; i<12; i++){
    //     await api.delete('shops', i);
    // }
    // await api.delete('profile', 1);
   
    
    // await api.post("profile", {
    //     name: "Petros Lympe",
    //     ranking_points: 165.50,
    //     image_url: "./assets/male-profile-picture.jpg"
    // })

    // await api.post('shops', {
    //     name: 'North Padel Club',
    //     location: '38.00297048358404, 23.857774267125386',
    //     location_name: 'Leof. Spaton 74, Gerakas 153',
    //     min_price: 49.50,
    //     image_url: './assets/north-padel-club.jpg',
    //     racket_price: 1,
    //     balls_price:5,
    //     commission_rate: 0.025,
    //     cover_commissions:true
    // })

    // await api.post('shops', {
    //     name: 'Padel Place - Marousi',
    //     location: '38.04333580239508, 23.822192556346824',
    //     location_name: 'Makrigianni 24, Marousi',
    //     min_price: 50.40,
    //     image_url: './assets/padel-place-marousi.jpg',
    //     racket_price: 1.10,
    //     commission_rate: 0.025,
    //     cover_commissions:true
    // })

    // api.get('shops').then(shops => {
    //     debugger;
    // })