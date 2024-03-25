import Home from "./views/home.js";
import Tournaments from "./views/tournaments.js";
import ProfileView from "./views/profileView.js";

class Router {
    navigation = {
        "current":"",
        "prev": "",
        "next": ""
    };

    index = 0;
    history = [];


    constructor(){
        this.home = new Home();
        this.tournaments = new Tournaments();
        this.profileView = new ProfileView();
    }

    navigate(page, prev_triggered){
        if(page == this.navigation.current && page !== "modal") return;
        
        if(!prev_triggered){
            this.history.push(page);
            this.index ++;
        }

        this.resetMenuIcons();
        this.setFilledMenuIcon(page);

        // If navigate to a view - Display the View //
        this.changeView(page);

        switch(page){
            case "home":
                this.home.render();
                break;
            case "tournament":
                this.tournaments.render();
                break;
            case "profile":
                this.profileView.render();
                break;
            case "modal":
                break;
            default:
                return;
        }
        console.log(this.navigation);
    }

    prev(){
        this.index --;
        this.navigate(this.history[this.index - 1], true);
        this.history.pop();
    }

    changeView(view){
        if($(`#${view}`).length > 0){
            $('.view').hide();
            $(`#${view}`).show();
        }
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