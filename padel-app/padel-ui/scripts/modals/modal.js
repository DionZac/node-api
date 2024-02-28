class Modal {
    constructor(){

    }

    attach(){
        $('#modal').html(this.createHTML());

        $('.modal-header img').off('click').on('click', () => {
            // Close modal //
            this.close();
        })
    }

    open(){

        $('#modal').removeClass('close-modal').addClass('open-modal')
        $('#main').removeClass('open-main').addClass('close-main');
    }

    close(){
        $('#modal').removeClass('open-modal').addClass('close-modal');
        $('#main').removeClass('close-main').addClass('open-main');
       
        window.router.navigate(window.router.navigation.prev);
    }
}

export default Modal;