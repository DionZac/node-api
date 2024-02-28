class Place {
    name;
    location;
    image;
    price;
    id;
    favourite = false;
    
    constructor(options){
        for(let attr in options){
            this[attr] = options[attr];
        }
    }
}

export default Place;