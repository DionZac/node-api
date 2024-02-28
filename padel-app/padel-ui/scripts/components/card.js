class Card {
    name;
    location;
    date;
    time;
    image;
    id;

    constructor(){
        // DUMMY OBJECT
        this.name = "Padel Place - Marousi";
        this.location = "-15.6723441,38.1231238626";
        this.date = "24-02-2024";
        this.time = "18:00 - 19:30";
        this.image = "./assets/padel-place-marousi.jpg";
        this.id = 1;
    }

    createHTML(){
        return(`
            <div class="card">
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