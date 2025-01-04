import Modal from "../../components/popup/modal.js";
import Patient from "../../objects/patient.js";

class PatientsList {
    list = $('#patientList');

    constructor(params) {
        this.collection = window.collections.patients;
        this.patients = window.collections.patients.records;
    }

    show(){
        this.list.html('');

        for(let patient of this.patients){
            this.list.append(this.patientHTML(patient));
        }

        $(".patient-item").off('click').on('click', (e) => {
            // Check if "edit" button pressed to open form instead of modal
            if(e.target.dataset.type == "edit-patient"){
                this.openForm(e.currentTarget.dataset.rowid);
                return;
            }


            let patient = this.collection.find(e.currentTarget.dataset.rowid);

            let modal = new Modal({
                id: "patientModal",
                header: "Patient Details",
                body: this.patientDetailsHTML(patient)
            });

            modal.show();
        });

        $("#newPatient").off('click').on('click', () => {
            this.openForm();
        })
    }

    openForm(id){
        window.router.openView("patient_form");
        let view = window.views.patient_form;
        if(id){
            let patient = this.collection.find(id);
            view.type = "update";
            view.patient = patient;
        }
        else{
            view.type = "new";
            view.patient = new Patient();   
        }

        view.updateView();
    }

    patientDetailsHTML(patient){
        return `
            <div class="modal-item"><label>Full Name:</label> <span> ${patient.fullname}</span></div>
            <div class="modal-item"><label>AMKA:</label> <span>${patient.amka}</span></div>
            <div class="modal-item"><label>Phone:</label> <span>${patient.phone_number}</span></div>
            <div class="modal-item"><label>Email:</label> <span>${patient.email}</span></div>
        `
    }

    patientHTML(patient) {
        return `
            <div class="patient-item" data-rowid="${patient.rowid}" data-name="${patient.firstname} ${patient.lastname}" data-phone="${patient.phone_number}" data-amka="${patient.amka}">
                <div class="patient-info">
                    <img src="${patient.picture}" alt="Profile">
                    <div>
                        <span class="fullname">${patient.fullname}</span><br>
                        <span class="phone"> ${patient.phone_number} </span>
                    </div>
                </div>
                <span class="amka">AMKA: ${patient.amka}</span>
                <span class="material-icons edit-icon" data-type="edit-patient">edit</span>
            </div>
        `
    }
}

export default PatientsList;