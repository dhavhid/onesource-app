/**
 * Created by david on 8/3/15.
 */
$.noty.defaults = {
    layout: 'topRight',
    theme: 'relax', // or 'relax'
    type: 'alert',
    text: '', // can be html or string
    dismissQueue: true, // If you want to use queue feature set this true
    template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
    animation: {
        open: 'animated fadeIn', // or Animate.css class names like: 'animated bounceInLeft'
        close: 'animated flipOutX', // or Animate.css class names like: 'animated bounceOutLeft'
        easing: 'swing',
        speed: 10 // opening & closing animation speed
    },
    timeout: 5, // delay for closing event. Set false for sticky notifications
    force: true, // adds notification to the beginning of queue when set to true
    modal: false,
    maxVisible: 5, // you can set max visible notification for dismissQueue true option,
    killer: true, // for close all notifications before show
    closeWith: ['click'], // ['click', 'button', 'hover', 'backdrop'] // backdrop click will close all notifications
    callback: {
        onShow: function() {},
        afterShow: function() {},
        onClose: function() {},
        afterClose: function() {},
        onCloseClick: function() {},
    },
    buttons: false // an array of buttons
};

var validation_errors = '<strong>Error!</strong> Please fill in all the required fields with valid data before trying to submit this form.';
var login_errors = '<strong>Error!</strong> Please provide your email and password before attempting to login.';
var successfully_saved = '<strong>Success!</strong> The record was saved successfully.';
var failed_deleted = '<strong>Error!</strong> The record could not be deleted. Please try again later.';
var internal_server_error = '<strong>Error!</strong> Internal Server Error. Please try again later.';
var unauthorized = '<strong>Error!</strong> Your session has expired please login again.';
var forbidden = '<strong>Error!</strong> You are not authorized to access this resource. Please contact the administrator if you think this is an error.';
var _noty = null;

// handle errors
function handleMessages(response,code)
{
    code = parseInt(code);
    var messages = [];
    var _message = '<strong>Error!</strong> Invalid request.';

    if (code == 200) {
        if (response.data && response.data.data && response.data.data.message) {
            _message = response.data.data.message;
        } else {
            _message = successfully_saved;
        }
        jQuery.noty.closeAll();
        _noty = noty({text: _message, type: 'success', timeout: 8000});
        return;
    }

    if (code == 400) { // validation errors
        if (response.data.validation_errors != undefined) {
            messages = response.data.validation_errors;
            $.each(messages,function(field,error){
                _message = _message + '<li>' + error[0] + '</li>';
            });
            _message = validation_errors + '<br /><ul>' + _message + '</ul>';
        } else if (response.error_description != undefined) {
            _message = unauthorized;
        }
        jQuery.noty.closeAll();
        _noty = noty({text: _message, type: 'error', timeout: 8000});
        return;
    }

    if (code == 401) {
        jQuery.noty.closeAll();
        if (response.data && response.data.error_description) {
            _message = response.data.error_description;
        } else {
            _message = unauthorized;
        }
        _noty = noty({text: _message, type: 'error', timeout: 8000});
        document.location.href = '/#/logout';
        return;
    }

    if (code == 403 || code == 503) {
        jQuery.noty.closeAll();
        if (response.info != undefined) {
            var msj = response.info.message;
            _noty = noty({text: msj, type: 'error', timeout: 8000});
            return;
        }
        _noty = noty({text: forbidden, type: 'error', timeout: 8000});
        return;
    }

    if (code == 404) {
        _message = response.data.message;
        jQuery.noty.closeAll();
        _noty = noty({text: _message, type: 'error', timeout: 8000});
        return;
    }

    if (code == 405) {
        _message = response.data.message;
        jQuery.noty.closeAll();
        _noty = noty({text: _message, type: 'error', timeout: 8000});
        return;
    }

    if (code == 500) {
        jQuery.noty.closeAll();
        _noty = noty({text: internal_server_error, type: 'error', timeout: 8000});
        return;
    }

    jQuery.noty.closeAll();
    _noty = noty({text: _message, type: 'error', timeout: 8000});
}
jQuery(document).ready(function(){
    jQuery(".navbar-fixed-top").autoHidingNavbar({});
    var user = Cookies.getJSON('user');
    if (user) {
        jQuery('#elem_username').html(user.name + ' <span class="caret"></span>');
    }
});

var columns_width = {
    'date_of_referral': '7%',
    'id': '10%',
    'date_received': '7%',
    'case_type': '15%',
    'firstname': '15%',
    'lastname': '15%',
    'dob': '7%',
    'ssn': '10%',
    'phone': '10%',
    'phone_ext':'10%',
    'alt_phone': '10%',
    'address': '',
    'address1': '',
    'address2': '',
    'city': '15%',
    'zipcode': '7%',
    'doi': '7%',
    'body_parts': '15%',
    'other_ibp': '15%',
    'is_doctor_mpn': '7%',
    'employer_name': '15%',
    'attorney_notes': '',
    'scheduled_with': '15%',
    'appt_date': '7%',
    'date_moved': '7%',
    'clinic_notes': '',
    'patient_treating': '7%',
    'next_appt': '7%',
    'verified_with': '15%',
    'first_seen': '7%',
    'created_at': '7%',
    'updated_at': '7%',
    'created_by': '7%',
    'updated_by': '7%',
    'appt_reason_cancel_id': '15%',
    'appt_confirmed_id': '15%',
    'referral_source_id': '15%',
    'clinic_id': '7%',
    'insurance_company_id': '7%',
    'attorney_id': '7%',
    'doctor_id': '7%',
    'clinic_name': '20%',
    'clinic_address1': '',
    'clinic_address2': '',
    'clinic_city': '10%',
    'clinic_county': '15%',
    'doctor_name': '15%',
    'attorney_name': '15%',
    'lawoffice_name': '15%',
    'insurance_name': '15%',
    'confirmed': '7%',
    'cancelled': '7%',
    'createdBy': '15%',
    'updatedBy': '15%'
};