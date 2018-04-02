/**
 * Created by david on 8/3/15.
 */
var doctors_mod = angular.module('webClient.doctors',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar']);

doctors_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
        when('/doctors',{ // index
            controller: 'DoctorIndexController',
            templateUrl: 'doctors/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Doctors',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/doctors/create',{ // show form to new client
            controller: 'DoctorCreateController',
            templateUrl: 'doctors/createform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Doctors',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/doctors/:id/edit',{ // show form to edit client
            controller: 'DoctorUpdateController',
            templateUrl: 'doctors/updateform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Doctors',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/doctors/:id',{ // show
            controller: 'DoctorShowController',
            templateUrl: 'doctors/show.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Doctors',0)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/doctors/:id/delete',{ // delete
            controller: 'DoctorDeleteController',
            templateUrl: 'doctors/delete.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Doctors',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        });
    cfpLoadingBarProvider.includeSpinner = false;
});

doctors_mod.controller('DoctorIndexController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.doctors = {};
    $scope.pagination = {};
    $scope.q = '';
    $scope.form_has_errors = false;
    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.doctors = _data.data;
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
            $scope.getAll('doctors/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('doctors','GET');
        }
    };
    $scope.checkSearch = function(){
        if ($scope.q.length > 0){
            return true;
        }
        return false;
    };

    $scope.getAll('doctors','GET');

});

doctors_mod.controller('DoctorCreateController',function($scope,$routeParams,OneSourceApi,$timeout,$location){
    $scope.Doctor = {};
    $scope.doctorForm = {};
    $scope.clinics = {};

    $scope.loadCatalogs = function(){
        OneSourceApi.request('catalogs','GET',{q:'clinics'}).then(
        function(response){
            var _data = response.data;
            $scope.clinics = _data.data.clinics;
        },
        function(error){});
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "has-error";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.doctorForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('doctors','POST',{},$scope.Doctor).then(
            function(response){
                var _data = response.data;
                handleMessages(response.data.info.message,response.data.info.code);
                $location.path('/doctors/' + _data.data.id);

            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    $scope.loadCatalogs();
});

doctors_mod.controller('DoctorUpdateController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.Doctor = {};
    $scope.doctorForm = {};
    $scope.clinics = {};

    $scope.loadCatalogs = function(){
        OneSourceApi.request('catalogs','GET',{q:'clinics'}).then(
            function(response){
                var _data = response.data;
                $scope.clinics = _data.data.clinics;
            },
            function(error){});
    };

    $scope.getDoctor = function(){
        OneSourceApi.request('doctors/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Doctor = _data.data;
                $scope.Doctor.requesting_office_id = _data.data.clinic;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/doctors');
            }
        );
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.doctorForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('doctors/' + $routeParams.id,'PUT',{},$scope.Doctor).then(
            function(response){
                handleMessages(response.data.info.message,response.data.info.code);
                jQuery('#submit-button').prop('disabled',false);
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    $scope.getDoctor();
    $scope.loadCatalogs();
});

doctors_mod.controller('DoctorShowController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.Doctor = {};

    $scope.getDoctor = function(){
        OneSourceApi.request('doctors/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Doctor = _data.data;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/doctors');
            }
        );
    };
    $scope.getClinic = function(){
        OneSourceApi.request('doctors/' + $routeParams.id + '/clinic','GET').then(
            function(response){
                var _data = response.data;
                $scope.Doctor.clinic = _data.data;
            },
            function(error){}
        );
    };
    $scope.getDoctor();
    $scope.getClinic();
});

doctors_mod.controller('DoctorDeleteController',function($scope,$routeParams,OneSourceApi,$timeout){});