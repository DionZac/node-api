import Place from "../objects/place.js";
import Modal from "./modal.js";
import Card from "../components/card.js";

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
            availability:[
                "10:00 - 00:00"
            ],
            price: 32,
            type: 'place',
            id: 1
        }));
    }

    createHTML(){
        let card = new Card(this.places[0]).createHTML();
        return(`
            <div class="header modal-header">
                <img src="./assets/icons/arrow-left.png" />
                <span class="header-text"> Find a place </span>
            </div>
            <div class="modal-content">
                <div class="places-datepicker-container">
                    <span class="form-label form-label-one datepicker-label">
                        Date
                    </span>
                    <input class="form-value" placeholder="Select date..." type="datepicker" id="places-datepicker" />
                </div>
                <div class="places-timepicker-container form-container-two">
                    <div class="form-value-container-two places-timepicker-start">
                        <span class="form-label form-label-two timepicker-start">
                            Start
                        </span>
                        <input class="form-value" placeholder="Select time" type="timepicker" id="places-start" />
                    </div>
                    <div class="form-value-container-two places-timepicker-end">
                        <span class="form-label form-label-two timepicker-end">
                            End
                        </span>
                        <input class="form-value" placeholder="Select time" type="timepicker" id="places-end" />
                    </div>
                </div>
                <div class="form-value-search-container places-search-container">
                    <img src="./assets/icons/search.png" />
                    <input class="form-value form-value-search" id="places-search" placeholder="Search for a padel place or area..." />
                </div>
                <div class="places-container">
                    ${card}
                    ${card}
                </div>
            </div>
        `);
    }
}

export default PlacesModal;