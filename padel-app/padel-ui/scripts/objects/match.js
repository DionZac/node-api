class Match {
    date;
    price;
    players = {
        team_1:{
            player_1: window.user_profile
        },
        team_2:{
        }
    };
    court_id;
    court;
    shop;
    extras = {
        balls: 0,
        rackets:0
    }

    constructor(options) {
        for(let attr in options){
            this[attr] = options[attr];
        }
    }
}

export default Match;