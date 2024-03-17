import Card from "../components/card.js";
import BookModal from "../modals/bookModal/bookModal.js";


class Home {
    scheduled = [];

    elements = {};

    matches = [];

    constructor(){
        this.elements.matches = $('.scheduled-matches');

        if(this.matches.length > 0){
            this.elements.matches.find('.no-scheduled-match').hide();
        }

        $('.friendly-match-section, .favourites .add-new-place').off('click').on('click', () => {
            var modal = new BookModal();
            window.router.openModal(modal);

            window.m = modal;
        });

        // let card = new Card().createHTML();

        // $('.scheduled-matches').append(card);
        // $('.scheduled-matches').append(card);
        // $('.scheduled-matches').append(card);

        // $('.no-scheduled-match').hide();
    }

    async render(){
        this.matches = await api.get("matches");
        if(this.matches.length > 0){
            for(let match of this.matches){
                match.card_type = "scheduled-match";
                let card = new Card(match).createHTML();
                $('.scheduled-matches').append(card);
            }
            

            $('.no-scheduled-match').hide();
        }
        // debugger
        $('.page-loader-container').hide();
    }
}

export default Home;