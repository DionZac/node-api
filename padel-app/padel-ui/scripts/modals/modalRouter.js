

class ModalRouter {
    history = [];
    index = 0;

    constructor(modal) {
        this.modal = modal;
    }

    navigate(object){
        if(this.goingToPrev) return;

        this.history.push(object);
        this.current = object.id;
        this.index ++;
    }

    async prev(prevent_execution){
        this.goingToPrev = true;
        this.index --;
        this.current = this.history[this.index - 1].id;
        
        if(!prevent_execution){
            let view = this.history[this.index - 1];
            var call = this.modal[view.method](view.data);
            if(typeof(call) == Promise){
                await call;
            }
        }
        
        this.history.pop();
        this.goingToPrev = false;
    }
}

export default ModalRouter;