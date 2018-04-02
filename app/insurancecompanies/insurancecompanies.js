/**
 * Created by david on 8/3/15.
 */
var insurance_mod = angular.module('webClient.insurancecompanies',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar','ngSanitize']);

insurance_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
        when('/insurancecompanies',{ // index
            controller: 'InsuranceIndexController',
            templateUrl: 'insurancecompanies/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Insurance Companies',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/insurancecompanies/create',{ // show form to new client
            controller: 'InsuranceCreateController',
            templateUrl: 'insurancecompanies/createform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Insurance Companies',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/insurancecompanies/:id/edit',{ // show form to edit client
            controller: 'InsuranceUpdateController',
            templateUrl: 'insurancecompanies/updateform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Insurance Companies',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/insurancecompanies/:id',{ // show
            controller: 'InsuranceShowController',
            templateUrl: 'insurancecompanies/show.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Insurance Companies',0)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/insurancecompanies/:id/delete',{ // delete
            controller: 'InsuranceDeleteController',
            templateUrl: 'insurancecompanies/delete.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Insurance Companies',1)) {
                        handleMessages({},401);
                        $location.path('/reports');
                    }
                }
            }
        });
    cfpLoadingBarProvider.includeSpinner = false;
});

insurance_mod.controller('InsuranceIndexController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.insurances = {};
    $scope.pagination = {};
    $scope.q = '';
    $scope.form_has_errors = false;
    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.insurances = _data.data;
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
            $scope.getAll('insurancecompanies/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('insurancecompanies','GET');
        }
    };
    $scope.checkSearch = function(){
        if ($scope.q.length > 0){
            return true;
        }
        return false;
    };

    $scope.getAll('insurancecompanies','GET');

});

insurance_mod.controller('InsuranceCreateController',function($scope,$routeParams,OneSourceApi,$timeout,$location){
    $scope.Insurance = {};
    $scope.insuranceForm = {};

    $scope.getCities = function(){
        OneSourceApi.request('regions/cities','GET').then(
            function(response){
                $scope.cities = response.data.data;
            },
            function(error){

            }
        );
    }

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "has-error";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.insuranceForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('insurancecompanies','POST',{},$scope.Insurance).then(
            function(response){
                var _data = response.data;
                handleMessages(response.data.info.message,response.data.info.code);
                $location.path('/insurancecompanies/' + _data.data.id);

            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    //$scope.getCities();
});

insurance_mod.controller('InsuranceUpdateController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.Insurance = {};
    $scope.insuranceForm = {};

    $scope.getCities = function(){
        OneSourceApi.request('regions/cities','GET').then(
            function(response){
                $scope.cities = response.data.data;
            },
            function(error){

            }
        );
    }

    $scope.getInsurance = function(){
        OneSourceApi.request('insurancecompanies/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Insurance = _data.data;
                $scope.Insurance.zipcode = parseInt(_data.data.zipcode);
                //$scope.getCities();
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/insurancecompanies');
            }
        );
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.insuranceForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('insurancecompanies/' + $routeParams.id,'PUT',{},$scope.Insurance).then(
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
    $scope.getInsurance();
});

insurance_mod.controller('InsuranceShowController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.Insurance = {};

    $scope.getInsurance = function(){
        OneSourceApi.request('insurancecompanies/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Insurance = _data.data;
                $scope.Insurance.zipcode = parseInt(_data.data.zipcode);
                $scope.notes = _data.data.notes;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/insurancecompanies');
            }
        );
    };
    $scope.getInsurance();
});

insurance_mod.controller('InsuranceDeleteController',function($scope,$routeParams,OneSourceApi,$timeout){});