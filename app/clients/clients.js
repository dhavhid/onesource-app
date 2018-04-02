/**
 * Created by david on 7/28/15.
 */
var clients_mod = angular.module('webClient.clients',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar','ngSanitize']);

clients_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
    when('/referrals',{ // index
        controller: 'ReferralsController',
        templateUrl: 'clients/referrals.html',
        resolve: {
            authentication: function (Authentication,$location) {
                if (!Authentication.checkAccessToken()) {
                    $location.path('/login');
                }
            },
            access: function(Authentication, $location) {
                if (!Authentication.checkModuleAccess('Clients',0)) {
                    handleMessages({},503);
                    $location.path('/reports');
                }
            }
        }
    }).
    when('/referrals/create',{ // show form to new client
        controller: 'CreateFormController',
        templateUrl: 'clients/createform.html',
        resolve: {
            authentication: function (Authentication,$location) {
                if (!Authentication.checkAccessToken()) {
                    $location.path('/login');
                }
            },
            access: function(Authentication, $location) {
                if (!Authentication.checkModuleAccess('Clients',1)) {
                    handleMessages({},503);
                    $location.path('/reports');
                }
            }
        }
    }).
    when('/referrals/:id/edit',{ // show form to edit client
        controller: 'UpdateFormController',
        templateUrl: 'clients/updateform.html',
        resolve: {
            authentication: function (Authentication,$location) {
                if (!Authentication.checkAccessToken()) {
                    $location.path('/login');
                }
            },
            access: function(Authentication, $location) {
                if (!Authentication.checkModuleAccess('Clients',1)) {
                    handleMessages({},503);
                    $location.path('/reports');
                }
            }
        }
    }).
    when('/referrals/:id',{ // show
        controller: 'ClientsShowController',
        templateUrl: 'clients/show.html',
        resolve: {
            authentication: function (Authentication,$location) {
                if (!Authentication.checkAccessToken()) {
                    $location.path('/login');
                }
            },
            access: function(Authentication, $location) {
                if (!Authentication.checkModuleAccess('Clients',0)) {
                    handleMessages({},503);
                    $location.path('/reports');
                }
            }
        }
    }).
    when('/referrals/:id/delete',{ // delete
        controller: 'ClientsDeleteController',
        templateUrl: 'clients/delete.html',
        resolve: {
            authentication: function (Authentication,$location) {
                if (!Authentication.checkAccessToken()) {
                    $location.path('/login');
                }
            },
            access: function(Authentication, $location) {
                if (!Authentication.checkModuleAccess('Clients',1)) {
                    handleMessages({},503);
                    $location.path('/reports');
                }
            }
        }
    });
    cfpLoadingBarProvider.includeSpinner = true;
});

clients_mod.controller('ReferralsController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.Report = {
        allow_view: true,
        allow_edit: true,
        columns: []
    };
    $scope.clients = {};
    $scope.pagination = {};
    $scope.q = '';
    $scope.params = {
        "columns": [],
        "sortBy": "updated_at",
        "sortOrder": "desc",
        "perPage": 25,
        "q": ""
    };
    $scope.first_loaded = false;

    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.clients = response.data.data;
                $scope.Report.columns = response.data.columns;
                $scope.pagination.current_page = _data.pagination.current_page;
                $scope.pagination.has_more_pages = _data.pagination.has_more_pages;
                $scope.pagination.next_page_url = _data.pagination.next_page_url;
                $scope.pagination.prev_page_url = _data.pagination.prev_page_url;
                $scope.pagination.last_page = _data.pagination.last_page;
                $scope.pagination.total = _data.pagination.total;
                $scope.pagination.per_page = _data.pagination.per_page;
                $scope.pagination.from = _data.pagination.from;
                $scope.pagination.to = _data.pagination.to;
                $scope.pagination.current_request = _data.pagination.current_request_url;
                $timeout(function(){
                    if ($scope.first_loaded == false) {
                        sticky_headers();
                        $scope.first_loaded = true;
                        $scope.$apply();
                    }
                },1000);
            },
            function(error){
                $timeout(function(){
                    handleMessages(error.data,error.status);
                });
            });
    };
    $scope.firstPage = function(){
        if ($scope.pagination.current_page > 1) {
            $scope.getAll($scope.pagination.current_request + 'page=1','POST');
        } else {return false;}
    };
    $scope.prevPage = function(){
        if ($scope.pagination.prev_page_url) {
            $scope.getAll($scope.pagination.prev_page_url,'POST');
        } else {return false;}
    };
    $scope.nextPage = function(){
        if ($scope.pagination.next_page_url) {
            $scope.getAll($scope.pagination.next_page_url,'POST');
        } else {return false;}
    };
    $scope.lastPage = function(){
        if ($scope.pagination.current_page < $scope.pagination.last_page) {
            $scope.getAll($scope.pagination.current_request + 'page=' + $scope.pagination.last_page,'POST');
        } else {return false;}
    };
    $scope.gotoPage = function(_page){
        if (parseInt(_page) >= 1 && parseInt(_page) <= $scope.pagination.total){
            $scope.getAll($scope.pagination.current_request + 'page=' + _page,'POST');
        } else {return false;}
    };
    $scope.getColumnDate = function(column_name) {
        if (column_name == 'date_of_referral'
            || column_name == 'date_received'
            || column_name == 'doi'
            || column_name == 'appt_date'
            || column_name == 'next_appt'
            || column_name == 'first_seen'
        ) {
            return true;
        }
        return false;
    };

    $scope.getColumnDOB = function(column_name) {
        if (column_name == 'dob') {
            return true;
        }
        return false;
    };

    $scope.getColumnString = function(column_name) {
        if (column_name != 'date_of_referral'
            && column_name != 'date_received'
            && column_name != 'doi'
            && column_name != 'dob'
            && column_name != 'appt_date'
            && column_name != 'next_appt'
            && column_name != 'first_seen'
        ) {
            return true;
        }
        return false;
    };
    $scope.setOrder = function(sortby) {
        $scope.params.sortBy = sortby;
        if ($scope.params.sortOrder == 'desc') {
            $scope.params.sortOrder = 'asc';
        } else {
            $scope.params.sortOrder = 'desc';
        }
        $scope.getAll('search','POST',{},$scope.params);
    };
    $scope.isNewRecord = function(item,index){
        var created_date = moment(item.created_at).format('YYYY-MM-DD');
        var updated_date = moment(item.updated_at).format('YYYY-MM-DD');
        var today = moment().startOf('day').format('YYYY-MM-DD');
        if (item.confirmed !== null && index == 0) {
            return "td-success";
        }
        if (item.cancelled !== null && index == 0) {
            return "td-danger";
        }
        if ((item.created_at === item.updated_at) && created_date == today && index == 0) {
            return "td-info";
        }
        if ((item.created_at != item.updated_at) && updated_date == today && index == 0) {
            return "td-warning";
        }
        return "";
    };

    $scope.search = function(){
        if ($scope.q.length > 3){
            $scope.params.q = $scope.q;
            $scope.getAll('search','POST',{},$scope.params);
        }
        if ($scope.q.length == 0){
            $scope.params.q = '';
            $scope.getAll('search','POST',{},$scope.params);
        }
    };

    $scope.getAll('search','POST',{},$scope.params);
});

clients_mod.controller('ClientsIndexController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.clients = {};
    $scope.pagination = {};
    $scope.q = '';
    $scope.form_has_errors = false;
    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
            var _data = response.data;
            $scope.clients = response.data.data;
            $scope.pagination.current_page = _data.pagination.current_page;
            $scope.pagination.has_more_pages = _data.pagination.has_more_pages;
            $scope.pagination.next_page_url = _data.pagination.next_page_url;
            $scope.pagination.prev_page_url = _data.pagination.prev_page_url;
            $scope.pagination.last_page = _data.pagination.last_page;
            $scope.pagination.total = _data.pagination.total;
            $scope.pagination.per_page = _data.pagination.per_page;
            $scope.pagination.from = _data.pagination.from;
            $scope.pagination.to = _data.pagination.to;
            $scope.pagination.current_request = _data.pagination.current_request_url;
        },
        function(error){
            $timeout(function(){
                handleMessages(error.data,error.status);
            });
        });
    };
    $scope.firstPage = function(){
        if ($scope.pagination.current_page > 1) {
            $scope.getAll($scope.pagination.current_request + 'page=1','GET');
        } else {return false;}
    };
    $scope.prevPage = function(){
        if ($scope.pagination.prev_page_url) {
            $scope.getAll($scope.pagination.prev_page_url,'GET');
        } else {return false;}
    };
    $scope.nextPage = function(){
        if ($scope.pagination.next_page_url) {
            $scope.getAll($scope.pagination.next_page_url,'GET');
        } else {return false;}
    };
    $scope.lastPage = function(){
        if ($scope.pagination.current_page < $scope.pagination.last_page) {
            $scope.getAll($scope.pagination.current_request + 'page=' + $scope.pagination.last_page,'GET');
        } else {return false;}
    };
    $scope.gotoPage = function(_page){
        if (parseInt(_page) >= 1 && parseInt(_page) <= $scope.pagination.total){
            $scope.getAll($scope.pagination.current_request + 'page=' + _page,'GET');
        } else {return false;}
    };
    $scope.search = function(){
        if ($scope.q.length > 3){
            $scope.getAll('clients/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('clients','GET');
        }
    };
    $scope.checkSearch = function(){
        if ($scope.q.length > 0){
            return true;
        }
        return false;
    };

    $scope.getAll('clients','GET');
});

clients_mod.controller('CreateFormController',function($scope,$routeParams,OneSourceApi,$location,$filter,$timeout){
    $scope.Referral = {};
    $scope.Referral.body_parts = '';
    $scope.ReferralForm = {};
    $scope.selected_bodyparts = [];
    $scope.Insurance = {};
    $scope.passengers = [
        {
            name: '',
            dob: '',
            phone: '',
            address: '',
            ibp: '',
            appt_date: ''
        }
    ];
    $scope.n_passengers = 1;
    $scope.ReferralForm.region_options = {};
    $scope.ReferralForm.lawoffices_options = {};
    $scope.ReferralForm.attorneys_options = {};
    $scope.ReferralForm.clinics_options = {};
    $scope.ReferralForm.doctors_options = {};
    $scope.ReferralForm.confirmations_options = {};
    $scope.ReferralForm.cancelations_options = {};
    $scope.ReferralForm.bodyparts_options = {};
    $scope.ReferralForm.insurance_options = {};
    $scope.FormInvalid = false;
    $scope.FormErrors = [];
    $scope.ReferralForm.cities_options = [];
    $scope.yes_no_opts = [{'text':'Yes','value':1},{'text':'No','value':0}];
    $scope.summernoteoptions = {
        toolbar: [
            ['edit',['undo','redo']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['alignment', ['ul', 'ol']]
        ]
    };

    $scope.checkPI = function(){
        if ($scope.Referral.case_type == 'Personal Injury'){
            return true;
        }
        return false
    };
    $scope.checkWC = function(){
        if ($scope.Referral.case_type == 'Workers Compensation'){
            return true;
        }
        return false
    };
    $scope.loadCatalogs = function(){
        // load regions
        OneSourceApi.request('catalogs','GET',{q:'bodyparts,lawoffices,attorneys,doctors,clinics,confirmations,cancelations,regions,insurancecompanies',extended:1}).then(
            function(response){
                var _data = response.data;
                $scope.ReferralForm.region_options = _data.data.regions;
                $scope.ReferralForm.lawoffices_options = _data.data.lawoffices;
                $scope.ReferralForm.attorneys_options = _data.data.attorneys;
                $scope.ReferralForm.doctors_options = _data.data.doctors;
                $scope.ReferralForm.clinics_options = _data.data.clinics;
                $scope.ReferralForm.confirmations_options = _data.data.confirmations;
                $scope.ReferralForm.cancelations_options = _data.data.cancelations;
                $scope.ReferralForm.bodyparts_options = _data.data.bodyparts;
                $scope.ReferralForm.insurance_options = _data.data.insurancecompanies;
            },function(error){
                handleMessages(error.data,error.status);
            }
        );
    };

    $scope.loadCities = function(){
        var region_id = $scope.Referral.region_id;
        var region = _.where($scope.ReferralForm.region_options,{id:region_id});
        if (true) {
            OneSourceApi.request('catalogs','GET',{q:'cities',county:region[0].name,extended:1,county_id:region_id}).then(
                function(response){
                    var _data = response.data;
                    $scope.ReferralForm.cities_options = _data.data.cities;
                },function(error){});
        }
    };

    $scope.loadClinics = function(){
        var cityname = $scope.Referral.city;
        if (cityname != undefined) {
            OneSourceApi.request('catalogs','GET',{q:'clinics',city:cityname,extended:1}).then(
                function(response){
                    var _data = response.data;
                    $scope.ReferralForm.clinics_options = _data.data.clinics;
                },function(error){});
        }
    };

    $scope.loadDoctors = function(){
        if ($scope.Referral.clinic_id && parseInt($scope.Referral.clinic_id) > 0) {
            OneSourceApi.request('clinics/' + $scope.Referral.clinic_id + '/doctors','GET').then(
                function(response){
                    var _data = response.data;
                    $scope.ReferralForm.doctors_options = _data.data;
                },
                function(error){
                    handleMessages(error.data,error.status);
                }
            );
        }
    };

    $scope.loadLoginInfo = function() {
        if (!isNaN($scope.Referral.insurance_company_id)) {
            OneSourceApi.request('insurancecompanies/' + $scope.Referral.insurance_company_id + '/login','GET').then(
                function(response){
                    $scope.Insurance = response.data.data;
                    if ($scope.Insurance.notes == null) {
                        jQuery.noty.closeAll();
                        _noty = noty({text: 'No login info available!', type: 'information'});
                        return false;
                    }
                    jQuery('#login_info').modal('show');
                },function(error){}
            );
        }
    };

    // toggle selection for a given employee by name
    $scope.toggleSelection = function toggleSelection(bodypartname) {
        var idx = $scope.selected_bodyparts.indexOf(bodypartname);

        // is currently selected
        if (idx > -1) {
            $scope.selected_bodyparts.splice(idx, 1);
        }

        // is newly selected
        else {
            $scope.selected_bodyparts.push(bodypartname);
        }
        $scope.Referral.body_parts = $scope.selected_bodyparts.join(',');
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "has-error";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.addPassenger = function(){
        $scope.n_passengers = $scope.passengers.length + 1;
        $scope.passengers.push({
            name: '',
            dob: '',
            phone: '',
            address: '',
            ibp: '',
            appt_date: ''
        });
    };
    $scope.removePassenger = function(index){
        $scope.passengers.splice(index,1);
        $scope.n_passengers = $scope.n_passengers - 1;
    };
    $scope.hasErrors = function(){
        if ($scope.clientsForm.$pristine) return false;
        return $scope.clientsForm.$invalid;
    };

    $scope.setNullConCan = function(inputname) {
        if (inputname == 'confirmed') {
            $scope.Referral.appt_reason_cancel_id = null;
        } else {
            $scope.Referral.appt_confirmed_id = null;
        }
    };

    $scope.submitForm = function() {
        // set to null those dates or fields that are not required
        // --------------------------------------------------------------------------------------------------------------
        if ($scope.Referral.appt_date == undefined) {
            $scope.Referral.appt_date = null;
            $scope.clientsForm.appt_date.$valid = true;
        }
        if ($scope.Referral.date_moved == undefined) {
            $scope.Referral.date_moved = null;
            $scope.clientsForm.date_moved.$valid = true;
        }
        if ($scope.Referral.first_seen == undefined) {
            $scope.Referral.first_seen = null;
            $scope.clientsForm.first_seen.$valid = true;
        }
        if ($scope.Referral.next_appt == undefined) {
            $scope.Referral.next_appt = null;
            $scope.clientsForm.next_appt.$valid = true;
        }
        $timeout(function(){
            $scope.saveForm();
        },1000);
    }

    $scope.saveForm = function(){
        if (/*$scope.Referral.body_parts.length == 0 || */$scope.clientsForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }

        jQuery('#submit-button').prop('disabled',true);
        $scope.Referral.date_of_referral = $filter('date')($scope.Referral.date_of_referral, 'yyyy-MM-dd');
        $scope.Referral.date_received = $filter('date')($scope.Referral.date_received, 'yyyy-MM-dd');
        $scope.Referral.dob = $filter('date')($scope.Referral.dob, 'yyyy-MM-dd');
        $scope.Referral.appt_date = $filter('date')($scope.Referral.appt_date, 'yyyy-MM-dd HH:mm:ss');
        $scope.Referral.date_moved = $filter('date')($scope.Referral.date_moved, 'yyyy-MM-dd HH:mm:ss');
        $scope.Referral.first_seen = $filter('date')($scope.Referral.first_seen, 'yyyy-MM-dd');
        $scope.Referral.next_appt = $filter('date')($scope.Referral.next_appt, 'yyyy-MM-dd HH:mm:ss');
        OneSourceApi.request('clients','POST',{},$scope.Referral).then(
            function(response){
                var _data = response.data;
                if (_data.info.code == 200 && $scope.Referral.case_type == 'Personal Injury') {
                    // store passengers.
                    angular.forEach($scope.passengers, function(passenger,key){
                        passenger.client_id = _data.data.id;
                        passenger.dob = $filter('date')(passenger.dob, 'yyyy-MM-dd');
                        passenger.appt_date = $filter('date')(passenger.appt_date, 'yyyy-MM-dd HH:mm:ss');
                        OneSourceApi.request('clients/'+_data.data.id+'/passengers','POST',{},passenger).then(
                            function(__data){
                                console.log(__data);
                            },function(__error){
                                console.log(__error);
                        });
                    });
                }
                handleMessages(response.data.info.message,response.data.info.code);
                $location.path('/referrals/' + _data.data.id);
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };

    $scope.loadCatalogs();
});

clients_mod.controller('UpdateFormController',function($scope,$routeParams,OneSourceApi,$location,$filter,$route,$timeout){
    $scope.ReferralForm = {};
    $scope.Referral = {};
    $scope.selected_bodyparts = [];
    $scope.passengers = [];
    $scope.n_passengers = 0;
    $scope.ReferralForm.region_options = {};
    $scope.ReferralForm.lawoffices_options = {};
    $scope.ReferralForm.attorneys_options = {};
    $scope.ReferralForm.clinics_options = {};
    $scope.ReferralForm.doctors_options = {};
    $scope.ReferralForm.confirmations_options = {};
    $scope.ReferralForm.cancelations_options = {};
    $scope.ReferralForm.bodyparts_options = {};
    $scope.ReferralForm.insurance_options = {};
    $scope.ReferralForm.cities_options = [];
    $scope.FormInvalid = false;
    $scope.FormSaved = false;
    $scope.FormErrors = [];
    $scope.client_region = {};
    $scope.yes_no_opts = [{'text':'Yes','value':1},{'text':'No','value':0}];
    $scope.summernoteoptions = {
        toolbar: [
            ['edit',['undo','redo']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['alignment', ['ul', 'ol']]
        ]
    };

    $scope.getClient = function(){
        OneSourceApi.request('clients/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Referral = _data.data;
                $scope.Referral.zipcode = parseInt(_data.data.zipcode);
                $scope.Referral.date_of_referral = moment(_data.data.date_of_referral).toDate();
                $scope.Referral.date_received = moment(_data.data.date_received).toDate();
                $scope.Referral.dob = moment(_data.data.dob).toDate();
                if (_data.data.appt_date != null) {
                    $scope.Referral.appt_date = moment(_data.data.appt_date).toDate();
                }
                if (_data.data.appt_moved != null) {
                    $scope.Referral.appt_moved = moment(_data.data.appt_moved).toDate();
                }
                if (_data.data.first_seen != null) {
                    $scope.Referral.first_seen = moment(_data.data.first_seen).toDate();
                }
                $scope.selected_bodyparts = _data.data.body_parts.split(',');
                if ($scope.Referral.insurance_company != null) {
                    $scope.Referral.insurance_company_id = _data.data.insurance_company.id;
                }
                if (_data.data.law_office != null) {
                    $scope.Referral.referral_source_id = _data.data.law_office.id;
                }
                $scope.Referral.attorney_id = _data.data.attorney.id;
                if (_data.data.clinic != null) {
                    $scope.Referral.clinic_id = _data.data.clinic.id;
                }
                if (_data.data.doctor != null) {
                    $scope.Referral.doctor_id = _data.data.doctor.id;
                }
                if (_data.data.confirmation != null) {
                    $scope.Referral.appt_confirmed_id = _data.data.confirmation.id;
                }
                if (_data.data.reason_for_cancel != null) {
                    $scope.Referral.appt_reason_cancel_id = _data.data.reason_for_cancel.id;
                }
                $scope.Referral.insurance_company = undefined;
                $scope.Referral.law_office = undefined;
                $scope.Referral.clinic = undefined;
                $scope.Referral.attorney = undefined;
                $scope.Referral.doctor = undefined;
                $scope.Referral.confirmation = undefined;
                $scope.Referral.reason_for_cancel = undefined;
                if (_data.data.passengers != null) {
                    $scope.passengers = _data.data.passengers;
                    $scope.n_passengers = _data.data.passengers.length;
                }
                $scope.loadCatalogs();
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/referrals');
            });
    };

    $scope.checkPI = function(){
        if ($scope.Referral.case_type == 'Personal Injury'){
            return true;
        }
        return false
    };
    $scope.checkWC = function(){
        if ($scope.Referral.case_type == 'Workers Compensation'){
            return true;
        }
        return false
    };
    $scope.loadCatalogs = function(){
        // load regions
        var params = {q:'cities,bodyparts,lawoffices,attorneys,doctors,clinics,confirmations,cancelations,insurancecompanies',extended:1,city:$scope.Referral.city};
        if ($scope.client_region.name != undefined) {
            params.county = $scope.client_region.name;
        }
        OneSourceApi.request('catalogs','GET',params).then(
            function(response){
                var _data = response.data;
                $scope.ReferralForm.region_options = _data.data.regions;
                $scope.ReferralForm.lawoffices_options = _data.data.lawoffices;
                $scope.ReferralForm.attorneys_options = _data.data.attorneys;
                $scope.ReferralForm.doctors_options = _data.data.doctors;
                $scope.ReferralForm.clinics_options = _data.data.clinics;
                $scope.ReferralForm.confirmations_options = _data.data.confirmations;
                $scope.ReferralForm.cancelations_options = _data.data.cancelations;
                $scope.ReferralForm.bodyparts_options = _data.data.bodyparts;
                $scope.ReferralForm.insurance_options = _data.data.insurancecompanies;
                $scope.ReferralForm.cities_options = _data.data.cities;
            },
            function(error){}
        );
    };

    $scope.loadCities = function(){
        var region_id = $scope.Referral.region_id;
        var region = _.where($scope.ReferralForm.region_options,{id:region_id});
        if (true) {
            OneSourceApi.request('catalogs','GET',{q:'cities',county:region[0].name,extended:1,county_id:region_id}).then(
                function(response){
                    var _data = response.data;
                    $scope.ReferralForm.cities_options = _data.data.cities;
                },function(error){});
        }
    };

    $scope.loadClinics = function(){
        var cityname = $scope.Referral.city;
        if (cityname != undefined) {
            OneSourceApi.request('catalogs','GET',{q:'clinics',city:cityname,extended:1}).then(
                function(response){
                    var _data = response.data;
                    $scope.ReferralForm.clinics_options = _data.data.clinics;
                },function(error){});
        }
    };

    $scope.loadDoctors = function(){
        if ($scope.Referral.clinic_id && parseInt($scope.Referral.clinic_id) > 0) {
            OneSourceApi.request('clinics/' + $scope.Referral.clinic_id + '/doctors','GET').then(
                function(response){
                    var _data = response.data;
                    $scope.ReferralForm.doctors_options = _data.data;
                },
                function(error){
                    handleMessages(error.data,error.status);
                }
            );
        }
    };

    $scope.loadLoginInfo = function() {
        if (!isNaN($scope.Referral.insurance_company_id)) {
            OneSourceApi.request('insurancecompanies/' + $scope.Referral.insurance_company_id + '/login','GET').then(
                function(response){
                    $scope.Insurance = response.data.data;
                    if ($scope.Insurance.notes == null) {
                        jQuery.noty.closeAll();
                        _noty = noty({text: 'No login info available!', type: 'information'});
                        return false;
                    }
                    jQuery('#login_info').modal('show');
                },function(error){}
            );
        }
    };

    // toggle selection for a given employee by name
    $scope.toggleSelection = function toggleSelection(bodypartname) {
        var idx = $scope.selected_bodyparts.indexOf(bodypartname);

        // is currently selected
        if (idx > -1) {
            $scope.selected_bodyparts.splice(idx, 1);
        }

        // is newly selected
        else {
            $scope.selected_bodyparts.push(bodypartname);
        }
        $scope.Referral.body_parts = $scope.selected_bodyparts.join(',');
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.addPassenger = function(){
        $scope.n_passengers = $scope.passengers.length + 1;
        $scope.passengers.push({
            id: 0,
            name: '',
            dob: '',
            phone: '',
            address: '',
            ibp: '',
            appt_date: ''
        });
    };
    $scope.removePassenger = function(index){
        if (angular.isNumber($scope.passengers[index].id)) {
            // about to delete a record in database.
            if (confirm('Are you sure that you want to delete this record? This action cannot be undone.')) {
                OneSourceApi.request('clients/' + $routeParams.id + '/passengers/' + $scope.passengers[index].id, 'DELETE').then(
                function(response){
                    $scope.passengers.splice(index,1);
                    $scope.n_passengers = $scope.n_passengers - 1;

                },function(error){
                    handleMessages(error.data,error.status);
                });
            }
        } else {
            $scope.passengers.splice(index,1);
            $scope.n_passengers = $scope.n_passengers - 1;
        }
    };
    $scope.hasErrors = function(){
        if ($scope.clientsForm.$pristine) return false;
        return $scope.clientsForm.$invalid;
    };

    $scope.setNullConCan = function(inputname) {
        if (inputname == 'confirmed') {
            $scope.Referral.appt_reason_cancel_id = null;
        } else {
            $scope.Referral.appt_confirmed_id = null;
        }
    };

    $scope.setNullDates = function(objForm) {
        if ($scope.Referral[objForm] == undefined) {
            $scope.Referral[objForm] = null;
            $scope.clientsForm[objForm].$valid = true;
        }
    }

    $scope.submitForm = function() {
        // set to null those dates or fields that are not required
        // --------------------------------------------------------------------------------------------------------------
        if ($scope.Referral.appt_date == undefined) {
            $scope.Referral.appt_date = null;
            $scope.clientsForm.appt_date.$valid = true;
        }
        if ($scope.Referral.date_moved == undefined) {
            $scope.Referral.date_moved = null;
            $scope.clientsForm.date_moved.$valid = true;
        }
        if ($scope.Referral.first_seen == undefined) {
            $scope.Referral.first_seen = null;
            $scope.clientsForm.first_seen.$valid = true;
        }
        if ($scope.Referral.next_appt == undefined) {
            $scope.Referral.next_appt = null;
            $scope.clientsForm.next_appt.$valid = true;
        }
        $timeout(function(){
            $scope.saveForm();
        },1000);
    }

    $scope.saveForm = function(){
        $scope.Referral.date_of_referral = $filter('date')($scope.Referral.date_of_referral, 'yyyy-MM-dd');
        if (/*$scope.Referral.body_parts.length == 0 || */$scope.clientsForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        jQuery('#submit-button').prop('disabled',true);
        // parsing dates.
        $scope.Referral.date_of_referral = $filter('date')($scope.Referral.date_of_referral, 'yyyy-MM-dd');
        $scope.Referral.date_received = $filter('date')($scope.Referral.date_received, 'yyyy-MM-dd');
        $scope.Referral.dob = $filter('date')($scope.Referral.dob, 'yyyy-MM-dd');
        $scope.Referral.appt_date = $filter('date')($scope.Referral.appt_date, 'yyyy-MM-dd HH:mm:ss');
        $scope.Referral.date_moved = $filter('date')($scope.Referral.date_moved, 'yyyy-MM-dd HH:mm:ss');
        $scope.Referral.first_seen = $filter('date')($scope.Referral.first_seen, 'yyyy-MM-dd');
        $scope.Referral.next_appt = $filter('date')($scope.Referral.next_appt, 'yyyy-MM-dd HH:mm:ss');
        OneSourceApi.request('clients/' + $routeParams.id,'PUT',{},$scope.Referral).then(
            function(response){
                var _data = response.data;
                if (_data.info.code == 200 && $scope.Referral.case_type == 'Personal Injury') {
                    // store passengers.
                    angular.forEach($scope.passengers, function(passenger,key){
                        if (parseInt(passenger.id) > 0) {
                            OneSourceApi.request('clients/'+_data.data.id+'/passengers/' + passenger.id,'PUT',{},{
                                name: passenger.name,
                                dob: $filter('date')(passenger.dob, 'yyyy-MM-dd'),
                                phone: passenger.phone,
                                address: passenger.address,
                                ibp: passenger.ipb,
                                appt_date: $filter('date')(passenger.appt_date, 'yyyy-MM-dd HH:mm:ss')
                            }).then(
                                function(__data){
                                    //console.log(__data);
                                },function(__error){
                                    console.log(__error);
                                }
                            );
                        } else {
                            OneSourceApi.request('clients/'+_data.data.id+'/passengers','POST',{},passenger).then(
                                function(__data){
                                    console.log(__data);
                                },function(__error){
                                    console.log(__error);
                                }
                            );
                        }
                    });
                }
                handleMessages(response.data.info.message,response.data.info.code);
                //$location.path('/referrals/' + $routeParams.id + '/edit');
                $route.reload();
                jQuery('#submit-button').prop('disabled',false);
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    //$scope.loadCatalogs();
    $scope.getClient();
});

clients_mod.controller('ClientsShowController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.Referral = {};
    $scope.passengers = [];

    $scope.Mail = {
        to: -1,
        message: ''
    };
    $scope.mailForm = {};
    $scope.recepient = '';
    $scope.summernoteoptions = {
        toolbar: [
            ['edit',['undo','redo']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['alignment', ['ul', 'ol']]
        ]
    };

    $scope.get = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.Referral = _data.data;
                $scope.passengers = _data.data.passengers;
            },
            function(error){
                $timeout(function(){
                    handleMessages(error.data,error.status);
                });
            });
    };
    $scope.checkPI = function(){
        if ($scope.Referral.case_type == 'Personal Injury'){
            return true;
        }
        return false
    };
    $scope.checkWC = function(){
        if ($scope.Referral.case_type == 'Workers Compensation'){
            return true;
        }
        return false
    };

    $scope.delete = function () {
        if(confirm('Are you sure that you want to delete the record of this case?')) {
            OneSourceApi.request('clients/' + $scope.Referral.id,'DELETE').then(
                function(response) {
                    handleMessages(response,response.status);
                    $location.path('/referrals');
                },
                function(error) {
                    handleMessages(error.data,error.status);
                }
            );
        }
    }

    $scope.writeMail = function(_id, _name) {
        $scope.Mail.to = _id;
        $scope.recepient = _name;
        $scope.Mail.message = '';
        jQuery('#email_template').modal('show');
    }

    $scope.sendMail = function () {
        jQuery('#btn_sendmail').attr('disabled',true);
        if ($scope.Mail.message.length < 4) {
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            jQuery('#btn_sendmail').attr('disabled',false);
            return false;
        }
        $scope.Mail.id = $scope.Referral.id;
        OneSourceApi.request('mail','POST',{},$scope.Mail).then(
            function(response){
                handleMessages(response,response.data.info.code);
                jQuery('#btn_sendmail').attr('disabled',false);
                jQuery('#email_template').modal('hide');
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#btn_sendmail').attr('disabled',false);
                jQuery('#email_template').modal('hide');
            }
        );
    }

    $scope.get('clients/' + $routeParams.id,'GET');
});