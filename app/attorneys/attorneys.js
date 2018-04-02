/**
 * Created by david on 8/3/15.
 */
var attorneys_mod = angular.module('webClient.attorneys',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar']);

attorneys_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
        when('/attorneys',{ // index
            controller: 'AttorneyIndexController',
            templateUrl: 'attorneys/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Attorneys',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/attorneys/create',{ // show form to new client
            controller: 'AttorneyCreateController',
            templateUrl: 'attorneys/createform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Attorneys',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/attorneys/:id/edit',{ // show form to edit client
            controller: 'AttorneyUpdateController',
            templateUrl: 'attorneys/updateform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Attorneys',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/attorneys/:id',{ // show
            controller: 'AttorneyShowController',
            templateUrl: 'attorneys/show.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Attorneys',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/attorneys/:id/delete',{ // delete
            controller: 'AttorneyDeleteController',
            templateUrl: 'attorneys/delete.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Attorneys',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        });
    cfpLoadingBarProvider.includeSpinner = false;
});

attorneys_mod.controller('AttorneyIndexController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.attorneys = {};
    $scope.pagination = {};
    $scope.q = '';
    $scope.form_has_errors = false;
    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.attorneys = _data.data;
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
                    handleMessage(error.data,error.status);
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
            $scope.getAll('attorneys/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('attorneys','GET');
        }
    };
    $scope.checkSearch = function(){
        if ($scope.q.length > 0){
            return true;
        }
        return false;
    };

    $scope.getAll('attorneys','GET');

});

attorneys_mod.controller('AttorneyCreateController',function($scope,$routeParams,OneSourceApi,$timeout,$location){
    $scope.Attorney = {};
    $scope.attorneyForm = {};
    $scope.lawoffices = {};

    $scope.loadCatalogs = function(){
        OneSourceApi.request('catalogs','GET',{q:'lawoffices'}).then(
        function(response){
            var _data = response.data;
            $scope.lawoffices = _data.data.lawoffices;
        },
        function(error){});
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "has-error";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.attorneyForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('attorneys','POST',{},$scope.Attorney).then(
            function(response){
                var _data = response.data;
                handleMessages(response.data.info.message,response.data.info.code);
                $location.path('/attorneys/' + _data.data.id);

            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    $scope.loadCatalogs();
});

attorneys_mod.controller('AttorneyUpdateController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.Attorney = {};
    $scope.attorneyForm = {};
    $scope.lawoffices = {};

    $scope.loadCatalogs = function(){
        OneSourceApi.request('catalogs','GET',{q:'lawoffices'}).then(
            function(response){
                var _data = response.data;
                $scope.lawoffices = _data.data.lawoffices;
            },
            function(error){});
    };

    $scope.getAttorney = function(){
        OneSourceApi.request('attorneys/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Attorney = _data.data;
                $scope.Attorney.requesting_office_id = _data.data.lawoffice;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/attorneys');
            }
        );
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.attorneyForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        //console.log($scope.Referral);
        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('attorneys/' + $routeParams.id,'PUT',{},$scope.Attorney).then(
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
    $scope.getAttorney();
    $scope.loadCatalogs();
});

attorneys_mod.controller('AttorneyShowController',function($scope,$routeParams,OneSourceApi,$location){
    $scope.Attorney = {};

    $scope.getAttorney = function(){
        OneSourceApi.request('attorneys/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.Attorney = _data.data;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/attorneys');
            }
        );
    };
    $scope.getLawOffice = function(){
        OneSourceApi.request('attorneys/' + $routeParams.id + '/lawoffice','GET').then(
            function(response){
                var _data = response.data;
                $scope.Attorney.lawoffice = _data.data;
            },
            function(error){
                //handleMessages(error.data,error.status);
                //$location.path('/attorneys');
            }
        );
    };
    $scope.getAttorney();
    $scope.getLawOffice();
});

attorneys_mod.controller('AttorneyDeleteController',function($scope,$routeParams,OneSourceApi,$timeout){});