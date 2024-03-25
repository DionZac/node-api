class Modal {
    id;
    constructor(){
        this.id = this.makeid(5);
    }

    attach(){
        $('.container').append(`
            <div id="${this.id}" class="modal"></div>
        `);

        $(`#${this.id}`).html(this.createHTML());

        $(`#${this.id} .modal-back`).off('click').on('click', () => {
            // Close modal //
            this.back();
        })
    }

    open(close_main){

        $(`#${this.id}`).removeClass('close-modal').addClass('open-modal')
        
        if(close_main) {
            $('#main').removeClass('open-main').addClass('close-main');
        }
    }

    close(open_main){
        $(`#${this.id}`).removeClass('open-modal').addClass('close-modal');
        if(open_main){
            $('#main').removeClass('close-main').addClass('open-main');
        }

        setTimeout(() => {
            $(`#${this.id}`).remove();
        }, 500)
       
        window.router.prev()
    }

    hideHeader(){
        $(`#${this.id} .header`).hide();
        $(`#${this.id} .modal-content`).css('margin-top', '0');
        $(`#${this.id} .modal-back-container`).addClass('modal-back-container-transparent');
    }

    showHeader(){
        $(`#${this.id} .header`).show();
        $(`#${this.id} .modal-content`).css('margin-top', '11em');
        $(`#${this.id} .modal-back-container`).removeClass('modal-back-container-transparent');
    }

    makeid(length) {
        let result = '';
        const characters = '0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }
}

export default Modal;