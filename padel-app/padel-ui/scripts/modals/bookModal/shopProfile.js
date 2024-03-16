import Match from "../../objects/match.js";

class ShopProfile {
    shop;
    book = {
        courts: true,
        extras: false,
        friends: false,
    }
    selectedCourt;

    constructor(options){
        this.shop = options.shop;
        this.controller = options.controller;   
        this.match = new Match();
        this.match.date = this.controller.filters.date;
        this.match.start = this.controller.filters.time.start;
        this.match.end = this.controller.filters.time.end;

        this.match.shop = this.shop;
    }

    render(){
        $('#modal-place-page').html(this.createHTML());

        $('.shop-options .shop-option-selected').removeClass('shop-option-selected');
        $('.shop-options-book').addClass('shop-option-selected')


        $('.shop-options-home').off('click').on('click', () => {
            this.displayHome();
        });

        $('.shop-options-book').off('click').on('click', () => {
            this.displayBooking();         
        });

        for(let court of this.shop.courts){
            $('#shop-courts').prepend(this.courtHtml(court));
            $('#shop-courts').prepend(this.courtHtml(court));
            $('#shop-courts').prepend(this.courtHtml(court));
            $('#shop-courts').prepend(this.courtHtml(court));
            $('#shop-courts').prepend(this.courtHtml(court));
        }
        this.updatePrice();

        var self = this;
        $('.court').on('click', function() {
            $('.court').removeClass('selected-court');
            $(this).addClass('selected-court');
            self.selectedCourt = $(this).attr('id').split('-')[1];

            self.updatePrice();
        })

        $('#toggle-courts').on('click', () => {
            if(this.book.courts){
                // Close courts
                this.book.courts = false;
                $('#shop-courts').hide();
                $('#toggle-courts').addClass('fa-angle-down').removeClass('fa-angle-up');
            }
            else{
                // Open Courts
                this.book.courts = true;
                $('#shop-courts').show();
                $('#toggle-courts').removeClass('fa-angle-down').addClass('fa-angle-up');
            }
        });

        $('#toggle-extras').on('click', () => {
            if(this.book.extras){
                // Close extras
                this.book.extras = false;
                $('.shop-extras').hide();
                $('#toggle-extras').addClass('fa-angle-down').removeClass('fa-angle-up');
            }
            else{
                // Open extras
                this.book.extras = true;
                $('.shop-extras').show();
                $('#toggle-extras').removeClass('fa-angle-down').addClass('fa-angle-up');
            }
        })

        $('.extra-rackets .minus-container').on('click',  () => {
            if(this.match.extras.rackets == 0) return;

            this.match.extras.rackets --;
            $('.extra-rackets .counter-value-container span').text(this.match.extras.rackets);

            this.updatePrice();
        });

        $('.extra-rackets .plus-container').on('click',  () => {
            this.match.extras.rackets ++;
            $('.extra-rackets .counter-value-container span').text(this.match.extras.rackets);
            this.updatePrice();
        });

        $('.extra-balls .minus-container').on('click',  () => {
            if(this.match.extras.balls == 0) return;

            this.match.extras.balls --;
            $('.extra-balls .counter-value-container span').text(this.match.extras.balls);
            this.updatePrice();
        })

        $('.extra-balls .plus-container').on('click',  () => {
            this.match.extras.balls ++;
            $('.extra-balls .counter-value-container span').text(this.match.extras.balls);
            this.updatePrice();
        })

        $('.confirm-booking').on('click', () => {
            if(!this.selectedCourt) return;

            this.controller.openConfirmation(this.match);
        })
    }

    updatePrice(){
        if(!this.selectedCourt){
            if($('.confirm-booking').hasClass('disabled-confirm')){
            }
            else{
                $('.confirm-booking').addClass('disabled-confirm');
            }
            $('.confirm-booking-prompt-select').show();
            $('.confirm-booking-price').hide();

            return;
        }

        $('.confirm-booking').removeClass('disabled-confirm');
        $('.confirm-booking-prompt-select').hide();
        $('.confirm-booking-price').show();

        let court;
        for(let c of this.shop.courts) if(c.rowid == this.selectedCourt) court = c;
        this.match.court = court;
        
        this.match.price = 
            court.price_per_hour + 
            (this.shop.balls_price * this.match.extras.balls) +
            (this.shop.racket_price * this.match.extras.rackets);

        $('.confirm-booking-price').text('Confirm Booking - ' + this.match.price.toFixed(2) + '$')
    }

    displayBooking(){
        $('.shop-option-selected').removeClass('shop-option-selected');
        $('.shop-options-book').addClass('shop-option-selected')

        $('.shop-content-option').hide();
        $('#shop-book').show();
    }

    displayHome(){
        $('.shop-option-selected').removeClass('shop-option-selected');
        $('.shop-options-home').addClass('shop-option-selected');

        $('.shop-content-option').hide();
        $('#shop-home').show();
    }

    courtHtml(court){
        let outdoor = JSON.parse(court.outdoor) ? "Outdoor" : "Indoor";
        return `
            <div class="court" id="court-${court.rowid}">
                <div class="court-name"> ${court.name} </div>
                <div class="court-outdoor"> ${outdoor} - Double </div>
                <div class="court-price"> ${court.price_per_hour.toFixed(2)}$ </div>
            </div>
        `
    }

    createHTML(){
        return `
            <div class="shop-profile">
                <div class="shop-image">
                    <img src=${this.shop.image_url} />
                </div>
                <div class="shop-details">
                    <div class="shop-name"> ${this.shop.name} </div>
                    <div class="shop-address"> ${this.shop.location_name} </div>
                    <div class="shop-directions" data-location="${this.shop.location}">
                    <i class="fa fa-2x fa-diamond-turn-right"></i>
                    </div>
                    <div class="shop-options">
                        <div class="shop-options-home">
                            Home
                        </div>
                        <div class="shop-options-book shop-option-selected">
                            Book
                        </div>
                    </div>
                </div>
                <div class="shop-content">
                    <div id="shop-home" class="shop-content-option">

                    </div>
                    <div id="shop-book" class="shop-content-option">
                        <div class="label"> Select a Court <i id="toggle-courts" class="fa fa-1x fa-angle-up"></i> </div>
                        <div id="shop-courts">

                        </div>
                        <div class="form-seperator"></div>
                        <div class="label"> Add Extras <i id="toggle-extras" class="fa fa-1x fa-angle-down"></i></div>
                        <div class="shop-extras" style="display: none">
                            <div class="rackets-label"> Include Rackets (+${this.shop.racket_price}$ per racket) </div>
                            <div class="extra-rackets">
                                <i class="fa fa-2x fa-table-tennis-paddle-ball"></i>
                                <div class="counter">
                                    <div class="minus-container">
                                        <i class="fa fa-1x fa-minus"></i>
                                    </div>
                                    <div class="counter-value-container">
                                        <span> 0 </span>
                                    </div>
                                    <div class="plus-container">
                                        <i class="fa fa-1x fa-plus"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="balls-label"> Include Balls (+${this.shop.balls_price}$ per Can) </div>
                            <div class="extra-balls">
                                <i class="fa fa-2x fa-baseball"></i>
                                <div class="counter">
                                    <div class="minus-container">
                                        <i class="fa fa-1x fa-minus"></i>
                                    </div>
                                    <div class="counter-value-container">
                                        <span> 0 </span>
                                    </div>
                                    <div class="plus-container">
                                        <i class="fa fa-1x fa-plus"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="confirm-booking">
                            <span class="confirm-booking-price"></span>
                            <span class="confirm-booking-prompt-select">Select Court</span>
                        </div>
                    </div>
                </div>
            </div>    
        `
    }
}

export default ShopProfile;