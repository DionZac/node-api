import ModalRouter from "../modalRouter.js";

class BookModalRouter extends ModalRouter{

    constructor(modal){
        super(modal);
    }

    navigate(object){
        super.navigate(object);

        $('.modal-view').hide();
        switch(object.id){
            case "find_place":
                $('.modal-view').hide();
                $('#modal-find-place').show();
                this.modal.showHeader();
                $('.modal-header .header-text').text("Find a Place");
                break;
            case "shop_profile":
                $('.modal-view').hide();
                $('#modal-place-page').show();

                this.modal.hideHeader();
                break;
            case "confirm_booking":
                $('.modal-view').hide();
                $('#modal-confirmation-page').show();
                this.modal.showHeader();
                $('.modal-header .header-text').text("Booking Confirmation");
                break;
        }
    }
}

export default BookModalRouter;