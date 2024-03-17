class Card {
    name;
    location;
    date;
    day_name;
    time;
    image;
    availability;
    rowid;

    type = "booked-match"

    constructor(options){
        
        if(options){
            if(options.card_type == "scheduled-match"){
                this.match = options;
            }
            else{
                for(let attr in options){
                    this[attr] = options[attr];
                }
            }
            
        }

        this.day_name = new Date(this.date).toLocaleDateString('en-us', {weekday: 'long'}).substring(0,3);
    }

    // Find a place Card HTML //
    createPlaceHtml(){
        return(`
            <div id="place-${this.rowid}" class="place card card-shadow">
                <div class="place-closed"></div>
                <div class="card-image-container">
                    <img class="card-image" src=${this.image_url} />
                </div>
                <div class="card-place-name-container">
                    <span class="card-place-name"> ${this.name} </span>
                </div>
                <div class="card-place-location-container">
                    <span class="card-place-location"> ${this.location_name} </span>
                </div>
                <div class="card-place-available-hours">
                    <span class="card-day"> ${this.day_name} | Available Hours</span>
                    <span class="card-hours"> ${this.available_hours[this.day_name.toLowerCase()]}</span> 
                </div>
                <div class="card-place-price">
                    <span class="card-price"> ${this.min_price.toFixed(2)}$ </span>
                </div>
            </div>
        `
        )
    }

    // Home page - Scheduled Matches Card HTML //
    createHTML(){
        if(this.type == "place"){
            return this.createPlaceHtml();
        }

        let time = `${this.match.start} - ${this.match.end}`;

        return(`
            <div id="scheduled-match-${this.match.rowid}" class="card card-shadow">
                <div class="card-image-container">
                    <img class="card-image" src=${this.match.shop.image_url} />
                </div>
                <div class="card-place-name-container">
                    <span class="card-place-name"> ${this.match.shop.name} </span>
                    <span class="card-court-name"> ${this.match.court.name} </span>
                </div>
                <div class="card-place-datetime">
                    <span class="card-date"> ${this.match.date}</span>
                    <span class="card-time"> ${time}</span> 
                </div>
            </div>
        `
        )
    }
}

export default Card;