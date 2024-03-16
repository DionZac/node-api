class ShopProfile {
    shop;
    constructor(shop){
        this.shop = shop;    
    }

    createHTML(){
        return `
            <h1> Shop - ${this.shop.name} </h1>
        `
    }
}

export default ShopProfile;