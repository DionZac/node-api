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
                <i class="fa fa-2x fa-angle-left"></i>
                <span class="header-text"> Find a place </span>
            </div>
            <div class="modal-content">
                <div class="places-filters">
                    <div class="places-datepicker-container">
                    <span class="form-label form-label-one datepicker-label">
                        Date
                    </span>
                    <input class="form-value form-shadow" placeholder="Select date..." type="datepicker" id="places-datepicker" />
                    </div>
                    <div class="places-timepicker-container form-container-two">
                        <div class="form-value-container-two places-timepicker-start">
                            <span class="form-label form-label-two timepicker-start">
                                Start
                            </span>
                            <input class="form-value form-shadow" placeholder="Select time" type="timepicker" id="places-start" />
                        </div>
                        <div class="form-value-container-two places-timepicker-end">
                            <span class="form-label form-label-two timepicker-end">
                                End
                            </span>
                            <input class="form-value form-shadow" placeholder="Select time" type="timepicker" id="places-end" />
                        </div>
                    </div>
                    <div class="places-filter-search">
                        <div class="form-value-search-container form-shadow places-search-container">
                            <i class="fa fa-1x fa-search"></i>
                            <input class="form-value form-value-search" id="places-search" placeholder="Search for a padel place or area..." />
                        </div>
                        <i id="places-filters" class="fa fa-4x fa-list-ul"></i>
                    </div>
                    <div class="filter-result"> Wed | 24-02-2024    19:00 - 20:30 </div> 
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