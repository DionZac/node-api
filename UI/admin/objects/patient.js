class Patient {
    firstname = "";
    lastname = "";
    phone_number = "";
    amka = "";
    email = "";
    picture = "";
    area = "";
    notes = "";
    user = -1;

    constructor(params) {
        for(let attr in params) this[attr] = params[attr];

        return this;
    }
}

export default Patient;