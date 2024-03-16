

class ModalRouter {
    history = [];
    index = 0;

    constructor(modal) {
        this.modal = modal;
    }

    navigate(object){
        if(this.goingToPrev) return;

        this.history.push(object);
        this.index ++;
    }

    async prev(){
        this.goingToPrev = true;

        let view = this.history[--this.index - 1];
        var call = this.modal[view.method](view.data);
        if(typeof(call) == Promise){
            await call;
        }
        this.history.pop();
        this.goingToPrev = false;
    }
}

export default ModalRouter;