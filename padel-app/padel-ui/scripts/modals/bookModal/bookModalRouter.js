import ModalRouter from "../modalRouter.js";

class BookModalRouter extends ModalRouter{
    current = 'find_place';
    
    constructor(modal){
        super(modal);
    }

    navigate(object){
        super.navigate(object);

        // Confirmation modal display will be handled by controller //
        // if(object.id == "confirm_booking") return;

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
                $('#modal-confirmation-page').show().removeClass('close-modal-under').addClass('open-modal-under');
                $('#modal-place-page').addClass('modal-inactive');
                $('.confirm-receipt-booking').show();
                $('.confirm-booking').hide();
                $('#modal').scrollTop(0)
                
                // $('.modal-view').hide();
                // $('#modal-confirmation-page').show();
                // this.modal.showHeader();
                // $('.modal-header .header-text').text("Booking Confirmation");
                break;
        }
    }
}

export default BookModalRouter;