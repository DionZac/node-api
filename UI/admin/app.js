import PatientsCollection from "./collections/patientsCollection.js";
import Router from "./router.js";
import Dashboard from "./views/dashboard/dashboard.js";
import PatientForm from "./views/patient-form/patientForm.js";
import PatientsList from "./views/patientsList/patientsList.js";

(async () => {
    window.router = new Router();

    window.collections = {
        patients : new PatientsCollection()
    }

    window.views = {
        dashboard : new Dashboard(),
        patients : new PatientsList(),
        patient_form: new PatientForm()
    }

    await initializeCollections();

    window.router.openView('dashboard');

    $(".sidebar a").on('click', (e) => {
        $(".sidebar .active").removeClass("active");
        e.currentTarget.classList.add("active");
        window.router.openView($(e.currentTarget).data('link'));
    });

    // Toggle sidebar button
    $(".menu-toggle").click(function () {
        $(".sidebar").toggleClass("closed");
        $(".topbar").toggleClass("expanded");
        $(".content").toggleClass("expanded");

        // Change menu icon based on state
        if ($(".sidebar").hasClass("closed")) {
            $(".menu-toggle").addClass('closed');
            $(".menu-toggle i").text("menu");
        } else {
            $(".menu-toggle").removeClass('closed');
            $(".menu-toggle i").text("menu_open");
        }
    });
})();

async function initializeCollections() {

    for(let collection in window.collections){
        try{
            await window.collections[collection].get();
        }
        catch(e){};
    }
}