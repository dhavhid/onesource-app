/**
 * Created by david on 8/7/15.
 */
var sessions_mod = angular.module('webClient.sessions',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar']);

sessions_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.when('/login',{
        templateUrl: 'sessions/index.html',
        controller: 'LoginController'
    }).when('/logout',{
        template: '',
        controller: 'LogoutController'
    });
    cfpLoadingBarProvider.includeSpinner = false;
});

sessions_mod.controller('LoginController',function($scope,OneSourceApi,$location,$cookies){
    $scope.User = {};
    $scope.loginForm = {};
    $scope.client_id = '11D0DDFEAEFE5AE6D38C3A88F471552E';
    $scope.client_secret = '7CE967F43ACAA1FDD7D8B400E9BE3EE7';
    $scope.grant_type = 'password';

    $scope.isLoggedIn = function() {
        var at = $cookies.get('access_token');
        if (at != undefined) {
            $location.path('/reports');
        }
    }

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        if ($scope.loginForm.$invalid){
            jQuery.noty.closeAll();
            _noty = noty({text: login_errors, type: 'error'});
            return false;
        }

        jQuery('#submit-button').prop('disabled',true);
        // getting an access token
        OneSourceApi.request('sessions/login','POST',{},{
            grant_type:$scope.grant_type,
            client_id:$scope.client_id,
            client_secret:$scope.client_secret,
            username:$scope.User.email,
            password:$scope.User.password
        },true).then(
            function(response){
                var _data = response.data;
                if (_data.access_token) {
                    var _expires = new Date();
                    _expires.setSeconds(_expires.getSeconds() + parseInt(_data.expires_in));
                    $cookies.put('access_token',_data.access_token,{path:'/',expires:_expires});
                    // now get the modules that the user has access to.
                    OneSourceApi.request('sessions/access','GET').then(
                        function(_response){
                            var __data = _response.data;
                            $cookies.putObject('user',__data.user,{path:'/',expires:_expires});
                            jQuery('#elem_username').html(__data.user.name + ' <span class="caret"></span>');
                            $cookies.putObject('accesses',__data.data,{path:'/',expires:_expires});
                            // everything went fine, then redirect the user to the dashboard.
                            $location.path('/reports');
                        },
                        function(_error){
                            handleMessages(_error.data,_error.status);
                            jQuery('#submit-button').prop('disabled',false);
                        }
                    );
                } else {
                    handleMessages(response,response.status);
                    jQuery('#submit-button').prop('disabled',false);
                }
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };

    $scope.isLoggedIn();
});

sessions_mod.controller('LogoutController',function($scope,OneSourceApi,$location,$cookies){
    OneSourceApi.request('sessions/logout','GET').then(function(response){
        var _data = response.data;
        $cookies.remove('access_token');
        $cookies.remove('accesses');
        $cookies.remove('user');
        //handleMessages(response,_data.info.code);
        $location.path('/login');
    },
    function(_error){
        handleMessages(_error.data,_error.status);
        $location.path('/reports');
    });
});