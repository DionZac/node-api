import Patient from "../../objects/patient.js";

class PatientForm {
    type = "new";
    patient;

    elements = {
        firstname : $('#firstname'),
        lastname : $('#lastname'),
        phone_number: $('#phone'),
        amka : $('#amka')
    }

    constructor(params) {
        this.collection = window.collections.patients;
    }

    show(){
        $('#saveForm').off('click').on('click', async () => {
            for(let el in this.elements){
                if(this.elements[el].val() == ""){
                    this.showError();
                    return;
                }
            }

            this.updateObject();

            try{
                if(this.type == "new"){
                    await this.collection.create(this.patient);
                }
                else{
                    await this.collection.update(this.patient);
                }
                window.router.openView('patients');
            }
            catch(e){
                console.log(e);
                alert('Oups! Something went wrong!');
            }
        })
    }

    updateObject(){
        for(let el in this.elements){
            this.patient[el] = this.elements[el].val();
        }
    }

    updateView(){
        this.elements.firstname.val(this.patient.firstname),
        this.elements.lastname.val(this.patient.lastname),
        this.elements.phone_number.val(this.patient.phone_number),
        this.elements.amka.val(this.patient.amka)
    }

    showError(){
        
    }
}

export default PatientForm;