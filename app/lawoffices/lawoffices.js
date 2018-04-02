/**
 * Created by david on 8/3/15.
 */
var lawoffices_mod = angular.module('webClient.lawoffices',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar']);

lawoffices_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
        when('/lawoffices',{ // index
            controller: 'LawOfficeIndexController',
            templateUrl: 'lawoffices/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Law Offices',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/lawoffices/create',{ // show form to new client
            controller: 'LawOfficeCreateController',
            templateUrl: 'lawoffices/createform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Law Offices',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/lawoffices/:id/edit',{ // show form to edit client
            controller: 'LawOfficeUpdateController',
            templateUrl: 'lawoffices/updateform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Law Offices',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/lawoffices/:id',{ // show
            controller: 'LawOfficeShowController',
            templateUrl: 'lawoffices/show.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Law Offices',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/lawoffices/:id/delete',{ // delete
            controller: 'LawOfficeDeleteController',
            templateUrl: 'lawoffices/delete.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Law Offices',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        });
    cfpLoadingBarProvider.includeSpinner = false;
});

lawoffices_mod.controller('LawOfficeIndexController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.lawoffices = {};
    $scope.pagination = {};
    $scope.q = '';
    $scope.form_has_errors = false;
    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.lawoffices = _data.data;
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
            $scope.getAll('lawoffices/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('lawoffices','GET');
        }
    };
    $scope.checkSearch = function(){
        if ($scope.q.length > 0){
            return true;
        }
        return false;
    };

    $scope.getAll('lawoffices','GET');

});

lawoffices_mod.controller('LawOfficeCreateController',function($scope,$routeParams,OneSourceApi,$timeout,$location){
    $scope.LawOffice = {};
    $scope.lawofficeForm = {};
    $scope.summernoteoptions = {
        toolbar: [
            ['edit',['undo','redo']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['alignment', ['ul', 'ol']]
        ]
    };

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
        if ($scope.lawofficeForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('lawoffices','POST',{},$scope.LawOffice).then(
            function(response){
                var _data = response.data;
                handleMessages(response.data.info.message,response.data.info.code);
                $location.path('/lawoffices/' + _data.data.id);
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    //$scope.getCities();
});

lawoffices_mod.controller('LawOfficeUpdateController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.LawOffice = {};
    $scope.lawofficeForm = {};
    $scope.summernoteoptions = {
        toolbar: [
            ['edit',['undo','redo']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['alignment', ['ul', 'ol']]
        ]
    };

    $scope.getCities = function(){
        OneSourceApi.request('regions/cities','GET').then(
            function(response){
                $scope.cities = response.data.data;
            },
            function(error){

            }
        );
    }

    $scope.getLawOffice = function(){
        OneSourceApi.request('lawoffices/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.LawOffice = _data.data;
                $scope.LawOffice.zipcode = parseInt(_data.data.zipcode);
                //$scope.getCities();
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/lawoffices');
            }
        );
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.lawofficeForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('lawoffices/' + $routeParams.id,'PUT',{},$scope.LawOffice).then(
            function(response){
                var _data = response.data;
                handleMessages(response.data.info.message,response.data.info.code);
                jQuery('#submit-button').prop('disabled',false);
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    $scope.getLawOffice();
});

lawoffices_mod.controller('LawOfficeShowController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.LawOffice = {};
    $scope.lawofficeForm = {};

    $scope.getLawOffice = function(){
        OneSourceApi.request('lawoffices/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.LawOffice = _data.data;
                $scope.LawOffice.zipcode = parseInt(_data.data.zipcode);
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/lawoffices');
            }
        );
    };
    $scope.getLawOffice();
});

lawoffices_mod.controller('LawOfficeDeleteController',function($scope,$routeParams,OneSourceApi,$timeout){});