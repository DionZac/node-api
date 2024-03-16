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
                break;
            case "shop_profile":
                $('.modal-view').hide();
                $('#modal-place-page').show();
                break;
        }
    }
}

export default BookModalRouter;