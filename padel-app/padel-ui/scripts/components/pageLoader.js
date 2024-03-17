class PageLoader {
    constructor() {
        this.loader = this.createHTML();
    }

    display(){
        $('body').append(this.loader);
    }

    remove(){
        $('.page-loader-container').remove();
    }

    createHTML(){
        return `
            <div class="page-loader-container loader-container">
                <div class="loader">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        `
    }
}

export default PageLoader;