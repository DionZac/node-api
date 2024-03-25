class FriendProfile {
    removeButton = false;

    constructor(user){
        this.user = user;
    }

    includeRemoveButton(){
        this.removeButton = true;
    }

    createHTML(){
        let html = "";
        if(this.removeButton){
            html = `
                <div class="x-friend-container">
                    <i class="fa fa-1x fa-xmark"></i>
                </div>
            `
        }
        html += `
            <img src="${this.user.image_url}" />
            <span id="confirmation-friend-name"> ${this.user.name.split(' ')[0]} </span>
        `;


        return html;
    }
}

export default FriendProfile;