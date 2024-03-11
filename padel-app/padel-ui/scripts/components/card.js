class Card {
    name;
    location;
    date;
    day_name;
    time;
    image;
    availability;
    id;

    type = "booked-match"

    constructor(options){
        if(options){
            for(let attr in options){
                this[attr] = options[attr];
            }
        }

        this.day_name = new Date(this.date).toLocaleDateString('en-us', {weekday: 'long'}).substring(0,3);
    }

    createPlaceHtml(){
        return(`
            <div class="place card card-shadow">
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

    createHTML(){
        if(this.type == "place"){
            return this.createPlaceHtml();
        }

        return(`
            <div class="card card-shadow">
                <div class="card-image-container">
                    <img class="card-image" src=${this.image_url} />
                </div>
                <div class="card-place-name-container">
                    <span class="card-place-name"> ${this.name} </span>
                </div>
                <div class="card-place-datetime">
                    <span class="card-date"> ${this.date}</span>
                    <span class="card-time"> ${this.time}</span> 
                </div>
            </div>
        `
        )
    }
}

export default Card;