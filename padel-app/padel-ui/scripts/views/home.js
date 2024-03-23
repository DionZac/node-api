import Card from "../components/card.js";
import BookModal from "../modals/bookModal/bookModal.js";


class Home {
    scheduled = [];
    matches = [];

    rendered = false;

    constructor(){
        $('.friendly-match-section, .favourites .add-new-place').off('click').on('click', () => {
            var modal = new BookModal();
            window.router.openModal(modal);
        });
    }

    async render(){
        if(this.rendered) return;

        this.matches = await api.get("matches");
        if(this.matches.length > 0){
            for(let match of this.matches){
                match.card_type = "scheduled-match";
                let card = new Card(match).createHTML();
                $('.scheduled-matches').append(card);
            }
            

            $('.no-scheduled-match').hide();
        }
        
        // Hide Page-Loading when rendering is finished //
        this.rendered = true;
        $('.page-loader-container').hide();
    }

    appendMatch(match){
        if(this.matches.length == 0){
            $('.no-scheduled-match').hide();
        }
        
        match.card_type = "scheduled-match";
        this.matches.unshift(match);
        let card = new Card(match).createHTML();
        $('.scheduled-matches').prepend(card);
    }
}

export default Home;