class Card {
    name;
    location;
    date;
    time;
    image;
    availability;
    id;

    type = "booked-match"

    constructor(options){
        // DUMMY OBJECT
        this.name = "Padel Place - Marousi";
        this.location = "-15.6723441,38.1231238626";
        this.date = "24-02-2024";
        this.time = "18:00 - 19:30";
        this.image = "./assets/padel-place-marousi.jpg";
        this.id = 1;

        if(options){
            for(let attr in options){
                this[attr] = options[attr];
            }
        }
    }

    createPlaceHtml(){
        return(`
            <div class="place card card-shadow">
                <div class="card-image-container">
                    <img class="card-image" src=${this.image} />
                </div>
                <div class="card-place-name-container">
                    <span class="card-place-name"> ${this.name} </span>
                </div>
                <div class="card-place-location-container">
                    <span class="card-place-location"> ${this.location} </span>
                </div>
                <div class="card-place-available-hours">
                    <span class="card-day"> Mon | Available Hours</span>
                    <span class="card-hours"> ${this.availability[0]}</span> 
                </div>
                <div class="card-place-price">
                    <span class="card-price"> ${this.price.toFixed(2)}$ </span>
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
                    <img class="card-image" src=${this.image} />
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