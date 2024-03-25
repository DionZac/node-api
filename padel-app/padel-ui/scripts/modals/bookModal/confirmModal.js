class ConfirmModal {
    match;
    constructor(options) {
        this.match = options.match;
        this.controller = options.controller;
        this.filters = this.controller.filters;
    }

    render(){
        $('#modal-confirmation-page').html(this.createHTML());

        $('.confirm-receipt-booking').off('click').on('click', () => {
            this.controller.confirmBooking(this.match);
        });

        var self = this;
        $('.add-new-friend').off('click').on('click', function(){
            let id = $(this).attr('id');

            let html = self.createFriendProfileHTML(window.user_profile.friends[0]);
            $(`#${id}`).html(html);

            self.match.players.team_1.player_2 = window.user_profile.friends[0];
        })
    }

    createFriendProfileHTML(user){
        return `
            <img src="${user.image_url}" />
            <span id="confirmation-friend-name"> ${user.name.split(' ')[0]} </span>
        `
    }

    createAddNewFriendHTML(){
        return `
            <div class="confirmation-add-friend">
                <i class="fa fa-3x fa-plus"></i>
            </div>
            <span> Add Friend </span>
        `
    }

    createHTML(){
        let rackets_price = this.match.extras.rackets * this.match.shop.racket_price;
        let balls_price = this.match.extras.balls * this.match.shop.balls_price;
        let commission = this.match.price * this.match.shop.commission_rate;
        let total = this.match.price + commission;
        let day_name = moment(this.filters.date, "DD-MM-YYYY").format('dddd');
        let day_number = moment(this.filters.date, "DD-MM-YYYY").format('DD');
        let month_name = moment(this.filters.date, "DD-MM-YYYY").format('MMMM');

        let user = this.match.players.team_1.player_1;

        return `
            <div class="receipt-header">
                <div class="receipt-image-container">
                    <img src="${this.match.shop.image_url}" />
                </div>
                <div class="receipt-place-name"> ${this.match.shop.name} </div>
                <div class="receipt-place-court"> ${this.match.court.name} </div>
                <div class="form-seperator"></div>
            </div>
            <span class="label"> Players </span>
            <div class="confirmation-players">
                <div class="friend-profile">
                    <img src="${user.image_url}" />
                    <span id="confirmation-friend-name"> ${user.name} </span>
                </div>
                <div class="friend-profile add-new-friend" id="add-new-friend-1">
                    <div class="confirmation-add-friend">
                        <i class="fa fa-3x fa-plus"></i>
                    </div>
                    <span> Add Friend </span>
                </div>
                <div class="friend-profile add-new-friend" id="add-new-friend-2">
                    <div class="confirmation-add-friend">
                        <i class="fa fa-3x fa-plus"></i>
                    </div>
                    <span> Add Friend </span>
                </div>
                <div class="friend-profile add-new-friend" id="add-new-friend-3">
                    <div class="confirmation-add-friend">
                        <i class="fa fa-3x fa-plus"></i>
                    </div>
                    <span> Add Friend </span>
                </div>
            </div>
            <span class="label"> Receipt Details </span>
            <div class="confirmation-page">
                <div class="confirmation-header"> ${day_name} ${day_number} ${month_name} | ${this.match.start} - ${this.match.end} </div>

                <div class="form-seperator"></div>

                <div class="receipt-analysis">
                    <div class="receipt-row">
                        <div class="receipt-label"> Court Price </div>
                        <div class="receipt-value" id="receipt-court-price">${this.match.court.price_per_hour.toFixed(2)}$</div>
                    </div>
                    <div class="receipt-row">
                        <div class="receipt-label"> Extra Rackets (${this.match.extras.rackets}) </div>
                        <div class="receipt-value" id="receipt-rackets-price">${rackets_price.toFixed(2)}$</div>
                    </div>
                    <div class="receipt-row">
                        <div class="receipt-label"> Extra Balls Can (${this.match.extras.balls}) </div>
                        <div class="receipt-value" id="receipt-balls-price">${balls_price.toFixed(2)}$</div>
                    </div>
                    <div class="receipt-row">
                        <div class="receipt-label"> Service Fee (${this.match.shop.commission_rate * 100}%) </div>
                        <div class="receipt-value" id="receipt-commission-price">${commission.toFixed(2)}$</div>
                    </div>
                </div>

                <div class="form-seperator"></div>

                <div class="receipt-total">
                    <div class="receipt-row">
                        <div class="receipt-label"> Total </div>
                        <div class="receipt-value" id="receipt-total-price">${total.toFixed(2)}$</div>
                    </div>
                </div>
            </div>
            <div class="confirm-receipt-booking">
                <span class="confirm-booking-price">Complete Reservation - ${total.toFixed(2)}$</span>
            </div>
        `
    }
}

export default ConfirmModal;