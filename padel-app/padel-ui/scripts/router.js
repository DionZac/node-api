import Home from "./views/home.js";
import Tournaments from "./views/tournaments.js";

class Router {
    navigation = {
        "current":"",
        "prev": "",
        "next": ""
    };


    constructor(){
        this.home = new Home();
        this.tournaments = new Tournaments();

        this.navigate("home");
    }

    navigate(page){
        if(page == this.navigation.current) return;

        this.resetMenuIcons();
        this.setFilledMenuIcon(page);

        this.navigation.next = "";
        this.navigation.prev = this.navigation.current;
        this.navigation.current = page;
        switch(page){
            case "home":
                this.home.render();
                break;
            case "tournament":
                this.tournaments.render();
                break;
            case "modal":
                break;
            default:
                return;
        }
        console.log(this.navigation);
    }
    
    openModal(modal){
        modal.attach();
        modal.open();
        this.navigate('modal');
        
    }

    resetMenuIcons(){
        $('div[route="home"]').find('img').attr('src', './assets/icons/home.png');
        $('div[route="home"]').find('span').css('font-weight', '600');
        $('div[route="tournament"]').find('img').attr('src', './assets/icons/tournament.png');
        $('div[route="tournament"]').find('span').css('font-weight', '600');
        $('div[route="profile"]').find('img').attr('src', './assets/icons/profile.png');
        $('div[route="profile"]').find('span').css('font-weight', '600');
        $('div[route="matchmaking"]').find('img').attr('src', './assets/icons/matchmaking.png');
        $('div[route="matchmaking"]').find('span').css('font-weight', '600');
    }

    setFilledMenuIcon(page){
        $(`div[route=${page}]`).find('img').attr('src', `./assets/icons/${page}-filled.png`);
        $(`div[route=${page}]`).find('span').css('font-weight', '800');
    }
}   

export default Router;