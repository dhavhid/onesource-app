/**
 * Created by david on 7/28/15.
 */
/**
 * Created by david on 8/3/15.
 */
var bodyparts_mod = angular.module('webClient.bodyparts',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar']);

bodyparts_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
        when('/bodyparts',{ // index
            controller: 'BodyPartIndexController',
            templateUrl: 'bodyparts/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Body Parts',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        });
    cfpLoadingBarProvider.includeSpinner = false;
});

bodyparts_mod.controller('BodyPartIndexController',function($scope,$routeParams,OneSourceApi,$timeout,$window,$filter){
    $scope.bodyparts = {};
    $scope.pagination = {};
    $scope.BodyPart = {};
    $scope.bodypartForm = {};
    $scope.q = '';
    $scope.bodypart_title = 'New Body Part';
    $scope.form_has_errors = false;
    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.bodyparts = _data.data;
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
            $scope.getAll('bodyparts/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('bodyparts','GET');
        }
    };
    $scope.checkSearch = function(){
        if ($scope.q.length > 0){
            return true;
        }
        return false;
    };
    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine && parseInt(jQuery('#id').val()) < 1) return "has-error";
        if (formField.$valid) return "has-success";
        if (formField.$invalid) return "has-error";
        if (formField.$invalid && parseInt(jQuery('#id').val()) < 1) return "has-error";
    };
    $scope.openModal = function(){
        $scope.cancelation_title = 'New Body Part';
        // clean up the name and id fields
        jQuery('#name').val('');
        jQuery('#id').val(0);
        jQuery('#myModal').modal('show');
    };
    $scope.getBodyPart = function(id){
        OneSourceApi.request('bodyparts/' + id,'GET').then(
            function(response){
                jQuery('#myModal').modal('show');
                $scope.BodyPart = response.data.data;
                jQuery('#id').val(response.data.data.id);
                $scope.bodypart_title = 'Update Body Part';
            },
            function(error){
                handleMessages(error.data,error.status);
            }
        );
    };
    $scope.submitForm = function(){
        if ($scope.bodypartForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }

        jQuery('#submit-button').prop('disabled',true);

        if (parseInt(jQuery('#id').val()) < 1){
            var _url = 'bodyparts';
            var _method = 'POST';
        } else {
            var _url = 'bodyparts/' + jQuery('#id').val();
            var _method = 'PUT';
        }
        $scope.BodyPart.name = $filter('uppercase')($scope.BodyPart.name);
        OneSourceApi.request(_url,_method,{},$scope.BodyPart).then(
            function(response){
                handleMessages(response.data.info.message,response.data.info.code);
                if (_method == 'POST') {
                    jQuery('#myModal').modal('hide');
                } else {
                    $scope.confirmation_title = 'New Body Part';
                    jQuery('#submit-button').prop('disabled',false);
                    jQuery('#myModal').modal('hide');
                    // clean up the name and id fields
                    jQuery('#name').val('');
                    jQuery('#id').val(0);
                }
                $window.location.reload();
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#myModal').modal('hide');
                // clean up the name and id fields
                $scope.confirmation_title = 'New Body Part';
                jQuery('#name').val('');
                jQuery('#id').val(0);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };

    $scope.getAll('bodyparts','GET');

});

bodyparts_mod.controller('BodyPartDeleteController',function($scope,$routeParams,OneSourceApi,$timeout){});