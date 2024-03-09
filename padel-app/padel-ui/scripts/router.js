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
        var menuItems = ['home', 'tournament', 'profile', 'matchmaking'];
        for(let menuItem of menuItems){
            $(`div[route=${menuItem}]`).find('i').removeClass('fa-3x');
            $(`div[route=${menuItem}]`).find('span').css('font-weight', '600');
        }
    }

    setFilledMenuIcon(page){
        $(`div[route=${page}]`).find('i').addClass('fa-3x');
        $(`div[route=${page}]`).find('span').css('font-weight', '800');
    }
}   

export default Router;