class Modal {
    constructor(){

    }

    attach(){
        $('#modal').html(this.createHTML());

        $('#modal-back').off('click').on('click', () => {
            // Close modal //
            this.back();
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

    hideHeader(){
        $('.header').hide();
        $('.modal-content').css('margin-top', '0');
        $('.modal-back-container').addClass('modal-back-container-transparent');
    }

    showHeader(){
        $('.header').show();
        $('.modal-content').css('margin-top', '11em');
        $('.modal-back-container').removeClass('modal-back-container-transparent');
    }
}

export default Modal;