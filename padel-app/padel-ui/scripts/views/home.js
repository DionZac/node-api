import Card from "../components/card.js";
import PlacesModal from "../modals/placesModal.js";


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
            var modal = new PlacesModal();
            window.router.openModal(modal);
        });

        // let card = new Card().createHTML();

        // $('.scheduled-matches').append(card);
        // $('.scheduled-matches').append(card);
        // $('.scheduled-matches').append(card);

        // $('.no-scheduled-match').hide();
    }

    render(){
        $('.view').hide();
        $('#home').show();
    }
}

export default Home;