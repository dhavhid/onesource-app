/**
 * Created by david on 7/28/15.
 */
/**
 * Created by david on 8/3/15.
 */
var confirmations_mod = angular.module('webClient.confirmations',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar']);

confirmations_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
        when('/confirmations',{ // index
            controller: 'ConfirmationIndexController',
            templateUrl: 'confirmations/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Reasons to Confirm',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        });
    cfpLoadingBarProvider.includeSpinner = false;
});

confirmations_mod.controller('ConfirmationIndexController',function($scope,$routeParams,OneSourceApi,$timeout,$window,$filter){
    $scope.confirmations = {};
    $scope.pagination = {};
    $scope.Confirmation = {};
    $scope.confirmationForm = {};
    $scope.q = '';
    $scope.confirmation_title = 'New Reason to Confirm';
    $scope.form_has_errors = false;
    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.confirmations = _data.data;
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
            $scope.getAll('confirmations/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('confirmations','GET');
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
        $scope.cancelation_title = 'New Reason to Confirm';
        // clean up the name and id fields
        jQuery('#name').val('');
        jQuery('#id').val(0);
        jQuery('#myModal').modal('show');
    };
    $scope.getConfirmation = function(id){
        OneSourceApi.request('confirmations/' + id,'GET').then(
            function(response){
                jQuery('#myModal').modal('show');
                $scope.Confirmation = response.data.data;
                jQuery('#id').val(response.data.data.id);
                $scope.confirmation_title = 'Update Reason to Confirm';
            },
            function(error){
                handleMessages(error.data,error.status);
            }
        );
    };
    $scope.submitForm = function(){
        if ($scope.confirmationForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }

        jQuery('#submit-button').prop('disabled',true);

        if (parseInt(jQuery('#id').val()) < 1){
            var _url = 'confirmations';
            var _method = 'POST';
        } else {
            var _url = 'confirmations/' + jQuery('#id').val();
            var _method = 'PUT';
        }
        $scope.Confirmation.name = $filter('uppercase')($scope.Confirmation.name);
        OneSourceApi.request(_url,_method,{},$scope.Confirmation).then(
            function(response){
                handleMessages(response.data.info.message,response.data.info.code);
                if (_method == 'POST') {
                    jQuery('#myModal').modal('hide');
                } else {
                    $scope.confirmation_title = 'New Reason to Confirm';
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
                $scope.confirmation_title = 'New Reason to Confirm';
                jQuery('#name').val('');
                jQuery('#id').val(0);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };

    $scope.getAll('confirmations','GET');

});

confirmations_mod.controller('ConfirmationDeleteController',function($scope,$routeParams,OneSourceApi,$timeout){});