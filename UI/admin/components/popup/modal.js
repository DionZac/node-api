class Modal {
    constructor(params) {
        this.id = params.id;
        this.header = params.header;
        this.body = params.body;
    }

    show(){
        $('body').append(this.html());
        $('.modal').fadeIn().css("display" ,"flex");

        $(".close-btn").click((e) => {
            this.hide();
            this.remove();
        });
    }

    hide(){
        $('.modal').fadeOut();
    }

    remove(){
        $('.modal').detach();
    }

    html(){
        return `
            <div id="${this.id}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${this.header}</h2>
                        <span class="material-icons close-btn">close</span>
                    </div>
                    <div class="modal-body">
                        ${this.body}
                    </div>
                </div>
            </div>
        `
    }
}

export default Modal;