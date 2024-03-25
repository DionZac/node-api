import Modal from "../modal.js";
import PlacesModal from "./placesModal.js";
import ShopProfile from "./shopProfile.js";
import ConfirmModal from "./confirmModal.js";
import BookModalRouter from "./bookModalRouter.js";

import CartLoader from "../../components/cartLoader.js";

class BookModal extends Modal{
    filters = {};

    constructor(){
        super();

        this.placesModal = new PlacesModal({
            controller: this
        });

        this.router = new BookModalRouter(this);
    }

    open(){
        super.open(true);

        this.openPlacesModal();
    }

    close(){
        super.close(true);
    }

    async confirmBooking(match){
        var loader = new CartLoader();
        loader.display();
        try{
            await api.post('matches', match);
            window.router.home.appendMatch(match);
        }
        catch(e){
            // Error handling //
        }
        
        setTimeout(() => {
            this.close();
            loader.remove();
        }, 3000)
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

    openConfirmation(match){
        var confirm = new ConfirmModal({
            match: match,
            controller: this
        });
        confirm.render();

        this.router.navigate({
            method:'openConfirmation',
            data: match,
            id:'confirm_booking'
        });
    }

    openShop(shop){
        var shopProfile = new ShopProfile({
            shop: shop,
            controller: this
        });
        shopProfile.render();

        this.router.navigate({
            method:'openShop',
            data: shop,
            id: 'shop_profile'
        })
    }

    back(){
        if(this.router.index == 1){
            this.close(true);
        }
        else{
            if(this.router.current == "confirm_booking"){
                $('#modal-confirmation-page').removeClass('open-modal-under').addClass('close-modal-under');
                $('#modal-place-page').removeClass('modal-inactive');
                $('.confirm-receipt-booking').hide();
                $('.confirm-booking').show();
                this.router.prev(true); // prevent execution
            }
            else{
                this.router.prev();
            }
        }
    }

    createHTML(){
        return(`
            <div class="modal-back modal-back-container">
                <i class="fa fa-2x fa-angle-left"></i>
            </div>
            <div class="header modal-header">
                <span class="header-text"> Find a place </span>
            </div>
            <div class="modal-content">
                <div id="modal-find-place" class="modal-view">
                    
                </div>
                <div id="modal-place-page" class="modal-view">

                </div>
                <div id="modal-confirmation-page" class="modal-view-under">

                </div>
            </div>
        `);
    }
}

export default BookModal;