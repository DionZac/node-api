import Place from "../../objects/place.js";
import Modal from "../modal.js";
import Card from "../../components/card.js";
import ShopProfile from "./shopProfile.js";

class PlacesModal extends Modal {
    date = "03-10-2024";
    start = "19:00";
    end = "20:30";
    search;
    availability;

    places = [];
    placesRequest = new Promise((resolve, reject) => {
        this.placesLoaded = resolve;
        this.placesFailed = reject;
    });

    controller;
    rendered = false;

    filters;

    constructor(options){
        super();

        this.controller = options.controller;

        this.filters = {
            "date": "2024-03-17",
            "time": {
                "start": "20:00",
                "end": "21:30"
            }
        }

        try{
            api.get('shops').then(shops => {
                for(let shop of shops){
                    shop.type = "place";
                    shop.date = this.date;
                    this.places.push(shop);
                }

                this.placesLoaded();
            }).catch(e => {
                this.placesFailed(e);
            })
        }
        catch(e){
            this.placesFailed(e);
        }
    }

    render(){
        var self = this;

        $('.datepicker-container').off('click').on('click' , () => {
            $('#date-input')[0].showPicker(); // Display picker
        });

        $('#date-input').off('change').on('change', function() {
            let val = $('#date-input').val();
            let monthName = moment(val, "YYYY-MM-DD").format('MMMM').toUpperCase().substr(0,3);
            let date = `${moment(val, "YYYY-MM-DD").format("DD")} ${monthName}`
            $("#datepicker-value").text(date);
            self.filters.date = val;
        })

        $('.time-start-container').off('click').on('click', () => {
            $('#time-start-input')[0].showPicker(); 
        });
        $('#time-start-input').off('change').on('change', function() {
            let val = $('#time-start-input').val();
            $('#timestart-value').text(val);
            self.filters.time.start = val;
        })

        $('.time-end-container').off('click').on('click', () => {
            $('#time-end-input')[0].showPicker(); 
        });
        $('#time-end-input').off('change').on('change', function() {
            let val = $('#time-end-input').val();
            $('#timeend-value').text(val);
            self.filters.time.end = val;
        })
    }

    async loadShops(){
        try{
            $('.places-error').hide();
            await this.placesRequest;

            for(let shop of this.places){
                let card = new Card(shop).createHTML();
                $('.places-container').prepend(card);
            }
            var self = this;
            $('.place').on('click', function(){
                let shop_id = $(this).attr('id').split('-')[1];
                let shop;
                for(let place of self.places) if(place.rowid == shop_id) shop = place;
                
                self.openShop(shop);
            })

            this.rendered = true;
        }
        catch(e){
            /// Places request failed -- Display network error //
            $('.places-error').show();
        }
    }

    openShop(shop){
        this.controller.filters = this.filters;
        this.controller.openShop(shop);
    }

    createHTML(){
        let monthName = moment(this.filters.date, "YYYY-MM-DD").format('MMMM').toUpperCase().substr(0,3);
        let date = `${moment(this.filters.date, "YYYY-MM-DD").format("DD")} ${monthName}`
        return(`
            <div class="filters-container">
                <div class="places-filters">
                    <div class="datepicker-container">
                        <input style="display:none" type="date" id="date-input" />
                         <i class="fa fa-3x fa-calendar-days"></i>
                         <span id="datepicker-value"> ${date} </span>
                    </div>
                    <div class="vertical-seperator"></div>
                    <div class="time-start-container">
                        <input style="display:none" type="time" step=1800 id="time-start-input" />
                         <i class="fa fa-3x fa-clock"></i>
                         <span id="timestart-value"> ${this.filters.time.start} </span>
                    </div>
                    <div class="vertical-seperator"></div>
                    <div class="time-end-container">
                        <input style="display:none" type="time" step="1800" id="time-end-input" />
                         <i class="fa fa-3x fa-stopwatch"></i>
                         <span id="timeend-value"> ${this.filters.time.end} </span>
                    </div>
                </div>
                <div class="places-filter-search">
                    <div class="form-value-search-container places-search-container">
                        <i class="fa fa-1x fa-search"></i>
                        <input class="form-value form-value-search" id="places-search" placeholder="Search for a padel place or area..." />
                    </div>
                </div>
            </div>
            <div class="sort-by-container">
                <span id="sort-by"> Sort by Distance </span>
                <i class="fa fa-1x fa-angle-down"></i>
            </div>
            <div class="places-container">

            </div>
            <div class="places-error">
                Failed to load any places...
            </div>
        `);
    }
}

export default PlacesModal;