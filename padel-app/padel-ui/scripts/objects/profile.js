class Profile{
    name;
    image_url;
    ranking_points;
    date_created;

    matches = [];
    friends = [];

    constructor(options) {
        for(let attr in options){
            this[attr] = options[attr];
        }

        // Profile Promise to know when the profile is FULLY LOADED
        this.loadedresolve = null;
        this.loaded = new Promise((resolve, reject) => {
            this.loadedresolve = resolve;
        });

        this.loadFriends().then(() => {
            this.loadMatches().then(() => {
                this.loadedresolve();
            })
        })
    }

    // Load Friends List
    async loadFriends(){
        var connections = await api.get("connections", -1, {
            filter_by:{
                "user": this.rowid
            }
        });

        debugger;

        return new Promise((resolve,reject) => {
            setTimeout(() => {
                resolve();
            }, 2000);
        })    
    }

    // Load Matches List 
    loadMatches(){
        return new Promise((resolve,reject) => {
            setTimeout(() => {
                resolve();
            }, 2000);
        })    
    }

    createHTML(){
        return `
            <div class="profile-container radius-container">
                <div class="profile-details">
                    <img src="${this.image_url}" />
                    <span id="profile-name"> ${this.name} </span>
                </div>
                <div class="profile-actions">
                    <div class="edit-profile">
                        <span> Edit Profile </span>
                    </div>
                    <div class="find-friends">
                        <span> Find Friends </span>
                    </div>
                </div>
                <div class="profile-stats">
                    <div class="profile-stats-row">
                        <span class="profile-stats-label">Member Since </span>
                        <span id="profile-member-since" class="profile-stats-value">${this.date_created}</span>
                    </div>
                    <div class="profile-stats-row">
                        <span class="profile-matches-label">Matches </span>
                        <span id="profile-matches" class="profile-matches-value">${this.matches.length}</span>
                    </div>
                    <div class="profile-stats-row">
                        <span class="profile-friends-label">Friends</span>
                        <span id="profile-friends" class="profile-friends-value">${this.friends.length}</span>
                    </div>
                </div>
            </div>

            <div class="profile-ranking-container radius-container">
                <div class="profile-ranking">
                    <span id="profile-ranking-name"> ${this.name}'s </span>
                    Ranking
                </div>
                <div class="profile-ranking-score">
                    <span id="profile-score"> ${this.ranking_points}</span>
                    Points
                </div>
                <div class="profile-ranking-details">
                    <span>Details</span>
                    <i class="fa fa-1x fa-angle-right"></i>
                </div>
            </div>

            <div class="latest-matches-container">
                <div class="label">Latest Matches </div>
                <div class="scheduled-matches">
                    <div class="no-scheduled-match">
                        <img src="./assets/padel-icon.png" />
                        <span>No scheduled Matches</span>
                    </div>
                </div>
            </div>

            <div class="profile-rivals-container">
                <div class="label"><span id="profile-rivals-label-name"> ${this.name}'s </span> Rivals</div>

                <div class="profile-rivals">
                    <div class="profile-rival">
                        <img src="./assets/male-profile-picture.jpg" />
                        <span id="rival-name">Petros</span>
                        <span id="rival-ranking">250</span>
                    </div>
                </div>
            </div>
        `
    }
}

export default Profile;