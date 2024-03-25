import Modal from "../modal.js";
import FriendProfile
 from "../../components/friendProfile.js";
class FriendsModal extends Modal {
    parent;
    searchValue = "";

    selectedFriends = [];

    constructor(options){
        super();

        this.selectedFriends = options.friends;
    }

    render(){
        for(let friend of this.selectedFriends){
            this.addFriend(friend, true);
        }

        this.updateAvailable();
        $('.confirm-friends span').on('click', () => {
            this.parent.updatePlayers(this.selectedFriends);
            this.close();
        })
    }

    // Removed a selected friend //
    removeSelected(friend){
        for(let i=0; i<this.selectedFriends.length; i++){
            let selected = this.selectedFriends[i];
            if(selected.rowid == friend.rowid){
                this.selectedFriends.splice(i,1);
            }
        }

        this.updateAvailable();
    }

    // Update available friends to add container ///
    updateAvailable(){
        $('.available-friends-container').html('');

        let friends = window.user_profile.friends;
        for(let friend of friends){
            if(this.selectedFriends.includes(friend)) continue;

            $('.available-friends-container').append(this.createAvailableFriend(friend));
        }

        var self = this;
        $('.available-friend').on('click', function() {
            let id = $(this).attr('id').split('-')[1];
            id = parseInt(id);

            let friend;
            for(let f of friends){
                if(f.rowid == id) friend = f;
            }

            self.addFriend(friend);
        });
    }

    // Add friend in selected container //
    addFriend(friend, initial){
        let fprofile = new FriendProfile(friend);
        fprofile.includeRemoveButton();

        if($('.added-friends .add-new-friend').length > 0){
            let el = $('.added-friends .add-new-friend')[0];
            el.innerHTML = fprofile.createHTML();
            $(el).removeClass('add-new-friend');

            if(!initial){
                this.selectedFriends.push(friend);
                this.updateAvailable();
            }

            $(el).find('.x-friend-container').off('click').on('click' , () => {
                this.removeSelected(friend);
                $(el).html(this.createAddNew());
                $(el).addClass('add-new-friend');
            })
        }
    }

    open(){
        super.open(false);
    }

    back(){
        this.close();
    }

    close(){
        super.close(false);
    }

    // HTML for add new friend box
    createAddNew(){
        return `
        <div class="confirmation-add-friend">
            <i class="fa fa-3x fa-plus"></i>
        </div>
        `
    }

    // HTML for available friend box
    createAvailableFriend(user){
        return `
            <div id="friend-${user.rowid}" class="available-friend">
                <img src="${user.image_url}" />
                <span class="available-friend-name"> ${user.name} </span>
                <span class="available-friend-points"> ${user.ranking_points} </span>
            </div>
        `;
    }

    createHTML() {
        let user = window.user_profile;
        return `
            <div class="modal-back modal-back-container">
                <i class="fa fa-2x fa-angle-left"></i>
            </div>
            <div class="header modal-header">
                <span class="header-text"> Add Friends </span>
            </div>
            <div class="modal-content">
                <div class="added-friends">
                    <div class="confirmation-players">
                        <div class="friend-profile">
                            <img src="${user.image_url}" />
                            <span id="confirmation-friend-name"> ${user.name} </span>
                        </div>
                        <div class="friend-profile add-new-friend" id="added-new-friend-1">
                            <div class="confirmation-add-friend">
                                <i class="fa fa-3x fa-plus"></i>
                            </div>
                            <span> Add Friend </span>
                        </div>
                        <div class="friend-profile add-new-friend" id="added-new-friend-2">
                            <div class="confirmation-add-friend">
                                <i class="fa fa-3x fa-plus"></i>
                            </div>
                            <span> Add Friend </span>
                        </div>
                        <div class="friend-profile add-new-friend" id="added-new-friend-3">
                            <div class="confirmation-add-friend">
                                <i class="fa fa-3x fa-plus"></i>
                            </div>
                            <span> Add Friend </span>
                        </div>
                    </div>
                </div>
                <div class="form-value-search-container friends-search-container">
                    <i class="fa fa-1x fa-search"></i>
                    <input class="form-value form-value-search" id="friends-search" placeholder="Search your friends list" />
                </div>
                <div class="available-friends-container">

                </div>
                <div class="confirm-friends">
                    <span class="confirm-friends-text"> Confirm Players </span>
                </div>
            </div>
        `
    }
}

export default FriendsModal;