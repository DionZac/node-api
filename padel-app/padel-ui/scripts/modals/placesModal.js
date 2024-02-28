import Place from "../objects/place.js";
import Modal from "./modal.js";

class PlacesModal extends Modal {
    date = "Mon | 24-02-2024";
    start = "19:00";
    end = "20:30";
    search;
    availability;

    places = [];
    
    constructor(){
        super();
        
        this.places.push(new Place({
            name: 'Padel Place - Marousi',
            location: 'Makrigianni 24, Marousi',
            image: './assets/padel-place-marousi.jpg',
            price: '32$',
            id: 1
        }));
    }

    createHTML(){
        return(`
            <div class="header modal-header">
                <img src="./assets/icons/arrow-left.png" />
                <span class="header-text"> Find a place </span>
            </div>
            <div class="modal-content">

            </div>
        `);
    }
}

export default PlacesModal;