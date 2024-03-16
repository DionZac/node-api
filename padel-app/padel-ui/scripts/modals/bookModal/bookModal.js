import Modal from "../modal.js";
import PlacesModal from "./placesModal.js";
import ShopProfile from "./shopProfile.js";
import BookModalRouter from "./bookModalRouter.js";

class BookModal extends Modal{
    constructor(){
        super();

        this.placesModal = new PlacesModal({
            controller: this
        });

        this.router = new BookModalRouter(this);
    }

    open(){
        super.open();

        this.openPlacesModal();
    }
    
    async openPlacesModal(){
        if(!this.placesModal.rendered){
            var html = this.placesModal.createHTML();
            $('#modal-find-place').html(html);
            await this.placesModal.loadShops();  
        }
        
        this.router.navigate({
            method: 'openPlacesModal',
            id: 'find_place'
        })
    }

    openShop(shop){
        var shopProfile = new ShopProfile(shop);
        $('#modal-place-page').html(shopProfile.createHTML());

        this.router.navigate({
            method:'openShop',
            data: shop,
            id: 'shop_profile'
        })
    }

    back(){
        if(this.router.index == 1){
            this.close();
        }
        else{
            this.router.prev();
        }
    }

    createHTML(){
        return(`
            <div class="header modal-header">
                <i class="fa fa-2x fa-angle-left"></i>
                <span class="header-text"> Find a place </span>
            </div>
            <div class="modal-content">
                <div id="modal-find-place" class="modal-view">
                    
                </div>
                <div id="modal-place-page" class="modal-view">

                </div>
            </div>
        `);
    }
}

export default BookModal;