/**
 * Created by david on 8/3/15.
 */
var clinics_mod = angular.module('webClient.clinics',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar']);

clinics_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
        when('/clinics',{ // index
            controller: 'ClinicIndexController',
            templateUrl: 'clinics/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Clinics',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/clinics/create',{ // show form to new client
            controller: 'ClinicCreateController',
            templateUrl: 'clinics/createform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Clinics',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/clinics/:id/edit',{ // show form to edit client
            controller: 'ClinicUpdateController',
            templateUrl: 'clinics/updateform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Clinics',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/clinics/:id',{ // show
            controller: 'ClinicShowController',
            templateUrl: 'clinics/show.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Clinics',0)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/clinics/:id/delete',{ // delete
            controller: 'ClinicDeleteController',
            templateUrl: 'clinics/delete.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Clinics',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        });
    cfpLoadingBarProvider.includeSpinner = false;
});

clinics_mod.controller('ClinicIndexController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.clinics = {};
    $scope.pagination = {};
    $scope.q = '';
    $scope.form_has_errors = false;
    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.clinics = _data.data;
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
            $scope.getAll('clinics/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('clinics','GET');
        }
    };
    $scope.checkSearch = function(){
        if ($scope.q.length > 0){
            return true;
        }
        return false;
    };

    $scope.getAll('clinics','GET');

});

clinics_mod.controller('ClinicCreateController',function($scope,$routeParams,OneSourceApi,$timeout,$location){
    $scope.Clinic = {};
    $scope.clinicForm = {};
    $scope.clinicForm.region_options = {};
    $scope.summernoteoptions = {
        toolbar: [
            ['edit',['undo','redo']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['alignment', ['ul', 'ol']]
        ]
    };

    $scope.getCities = function(){
        if ($scope.Clinic.county.length > 0) {
            OneSourceApi.request('regions/county/1?countyname=' + $scope.Clinic.county,'GET').then(
                function(response){
                    $scope.cities = response.data.data;
                },
                function(error){

                }
            );
        }
    }

    $scope.getFormFieldClass = function(formField){
        if(formField == undefined) return "has-error";
        if (formField.$pristine) return "has-error";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.clinicForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('clinics','POST',{},$scope.Clinic).then(
            function(response){
                var _data = response.data;
                handleMessages(response.data.info.message,response.data.info.code);
                $location.path('/clinics/' + _data.data.id);

            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    $scope.loadCatalogs = function(){
        // load regions
        OneSourceApi.request('catalogs','GET',{q:'regions'}).then(
            function(response){
                var _data = response.data;
                $scope.clinicForm.region_options = _data.data.regions;
            },
            function(error){}
        );
    };
    $scope.loadCatalogs();
});

clinics_mod.controller('ClinicUpdateController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.Clinic = {};
    $scope.clinicForm = {};
    $scope.clinicForm.region_options = {};
    $scope.summernoteoptions = {
        toolbar: [
            ['edit',['undo','redo']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['alignment', ['ul', 'ol']]
        ]
    };

    $scope.getCities = function(){
        if ($scope.Clinic.county.length > 0) {
            OneSourceApi.request('regions/county/1?countyname=' + $scope.Clinic.county,'GET').then(
                function(response){
                    $scope.cities = response.data.data;
                },
                function(error){

                }
            );
        }
    }

    $scope.getClinic = function(){
        OneSourceApi.request('clinics/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Clinic = _data.data;
                $scope.Clinic.zipcode = parseInt(_data.data.zipcode);
                //$scope.getCities();
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/clinics');
            }
        );
    };

    $scope.getFormFieldClass = function(formField){
        if(formField == undefined) return "has-error";
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.clinicForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('clinics/' + $routeParams.id,'PUT',{},$scope.Clinic).then(
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
    $scope.loadCatalogs = function(){
        // load regions
        OneSourceApi.request('catalogs','GET',{q:'regions'}).then(
            function(response){
                var _data = response.data;
                $scope.clinicForm.region_options = _data.data.regions;
            },
            function(error){}
        );
    };
    $scope.loadCatalogs();
    $scope.getClinic();
});

clinics_mod.controller('ClinicShowController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.Clinic = {};

    $scope.getClinic = function(){
        OneSourceApi.request('clinics/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Clinic = _data.data;
                $scope.Clinic.zipcode = parseInt(_data.data.zipcode);
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/clinics');
            }
        );
    };
    $scope.getClinic();
});

clinics_mod.controller('ClinicDeleteController',function($scope,$routeParams,OneSourceApi,$timeout){});