/**
 * Created by david on 8/3/15.
 */

var users_mod = angular.module('webClient.users',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar']);

users_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
        when('/users',{ // index
            controller: 'UserIndexController',
            templateUrl: 'users/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Users',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/users/create',{ // show form to new client
            controller: 'UserCreateController',
            templateUrl: 'users/createform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Users',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/users/:id/edit',{ // show form to edit client
            controller: 'UserUpdateController',
            templateUrl: 'users/updateform.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Users',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/users/:id',{ // show
            controller: 'UserShowController',
            templateUrl: 'users/show.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Users',0)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        }).
        when('/users/:id/delete',{ // delete
            controller: 'UserDeleteController',
            templateUrl: 'users/delete.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                },
                access: function(Authentication, $location) {
                    if (!Authentication.checkModuleAccess('Users',1)) {
                        handleMessages({},503);
                        $location.path('/reports');
                    }
                }
            }
        });
    cfpLoadingBarProvider.includeSpinner = false;
});

users_mod.controller('UserIndexController',function($scope,$routeParams,OneSourceApi,$timeout){
    $scope.users = {};
    $scope.pagination = {};
    $scope.q = '';
    $scope.form_has_errors = false;
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

    $scope.getAll = function(endpoint,method,params,mydata){
        OneSourceApi.request(endpoint,method,params,mydata).then(function(response){
                var _data = response.data;
                $scope.users = _data.data;
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
            $scope.getAll('users/search','GET',{'q': $scope.q});
        }
        if ($scope.q.length == 0){
            $scope.getAll('users','GET');
        }
    };
    $scope.checkSearch = function(){
        if ($scope.q.length > 0){
            return true;
        }
        return false;
    };

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

    $scope.getAll('users','GET');
});

users_mod.controller('UserCreateController',function($scope,$routeParams,OneSourceApi,$timeout,$location){
    $scope.User = {};
    $scope.User.roles = [];
    $scope.userForm = {};
    $scope.roles = {};
    $scope.expiration_options = [
        {"text":'1 Day from now',"value":"1 day from now"},
        {"text":'1 Week from now',"value":"1 week from now"},
        {"text":'1 Month from now',"value":"1 month from now"}
    ];

    $scope.loadCatalogs = function(){
        OneSourceApi.request('catalogs','GET',{q:'roles'}).then(
            function(response){
                var _data = response.data;
                $scope.roles = _data.data.roles;
            },
            function(error){});
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "has-error";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        var selected_roles = jQuery("input[type='radio']:checked");
        if ($scope.userForm.$invalid || (parseInt(selected_roles.length) == 0)){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }

        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('users','POST',{},$scope.User).then(
            function(response){
                var _data = response.data;
                if (angular.isNumber(_data.data.id) && _data.info.code == '200') {
                    // add roles
                    var new_roles = [];
                    angular.forEach($scope.User.roles, function(value,key){
                        if (value.write != 'revoke') {
                            new_roles.push({
                                name: $scope.roles[key].id,
                                write: value.write,
                                user_id: _data.data.id
                            });
                        }
                    });
                    if (new_roles.length > 0) {
                        OneSourceApi.request('users/' + _data.data.id + '/roles','POST',{},new_roles).then(
                            function(__data){},
                            function(__error){}
                        );
                    }
                }
                handleMessages(response.data.info.message,response.data.info.code);
                $location.path('/users/' + _data.data.id);
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    $scope.loadCatalogs();
});

users_mod.controller('UserUpdateController',function($scope,$routeParams,OneSourceApi,$timeout,$location){
    $scope.User = {};
    $scope.User.roles = [];
    $scope.userForm = {};
    $scope.roles = {};
    $scope.d_roles = [];
    $scope.expiration_options = [
        {"text":'Never',"value":"never"},
        {"text":'1 Day from now',"value":"1 day from now"},
        {"text":'1 Week from now',"value":"1 week from now"},
        {"text":'1 Month from now',"value":"1 month from now"},
        {"text":'Revoke access inmediatly',"value":"revoke access"}
    ];

    $scope.loadCatalogs = function(){
        OneSourceApi.request('catalogs','GET',{q:'roles'}).then(
            function(response){
                var _data = response.data;
                $scope.roles = _data.data.roles;
            },
            function(error){});
    };

    $scope.getUser = function(){
        OneSourceApi.request('users/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.User = _data.data;
                $scope.d_roles = [];
                angular.forEach($scope.roles, function(value,index){
                    $scope.d_roles[index] = {write: 3};
                    angular.forEach($scope.User.roles, function(rol,i){
                        if (value.id == rol.name) {
                            $scope.d_roles[index] = rol;
                        }
                    });
                });
                $scope.User.roles = $scope.d_roles;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/users');
            }
        );
    };

    $scope.getFormFieldClass = function(formField){
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.submitForm = function(){
        var selected_roles = jQuery("input[type='radio']:checked");
        if ($scope.userForm.$invalid || (parseInt(selected_roles.length) == 0)){
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }

        jQuery('#submit-button').prop('disabled',true);
        OneSourceApi.request('users/' + $routeParams.id,'PUT',{},$scope.User).then(
            function(response){
                var _data = response.data;
                if (angular.isNumber(_data.data.id) && _data.info.code == '200') {
                    // delete roles and add them again.
                    OneSourceApi.request('users/' + $routeParams.id + '/roles','DELETE').then(function(success){
                        var new_roles = [];
                        angular.forEach($scope.User.roles, function(value,key){
                            if (parseInt(value.write) < 3) {
                                new_roles.push({
                                    name: $scope.roles[key].id,
                                    write: value.write,
                                    user_id: _data.data.id
                                });
                            }
                        });
                        if (new_roles.length > 0 && $scope.User.is_admin == 0) {
                            OneSourceApi.request('users/' + _data.data.id + '/roles','POST',{},new_roles).then(
                                function(__data){},
                                function(__error){}
                            );
                        }
                    },function(__error){});

                }
                handleMessages(response.data.info.message,response.data.info.code);
                $location.path('/users/' + _data.data.id);
            },
            function(error){
                handleMessages(error.data,error.status);
                jQuery('#submit-button').prop('disabled',false);
            }
        );
    };
    $scope.loadCatalogs();
    $scope.getUser();
});

users_mod.controller('UserShowController',function($scope,$routeParams,OneSourceApi,$timeout,$location){
    $scope.User = {};
    $scope.User.roles = [];
    $scope.userForm = {};
    $scope.roles = {};
    $scope.d_roles = [];

    $scope.loadCatalogs = function(){
        OneSourceApi.request('catalogs','GET',{q:'roles'}).then(
            function(response){
                var _data = response.data;
                $scope.roles = _data.data.roles;
            },
            function(error){});
    };

    $scope.getUser = function(){
        OneSourceApi.request('users/' + $routeParams.id,'GET').then(
            function(response){
                var _data = response.data;
                $scope.User = _data.data;
                $scope.d_roles = _data.data.roles;
                angular.forEach($scope.User.roles, function(value,index){
                    if (value.name == 'Confirmations') {
                        $scope.User.roles[index].name = 'Reasons to Confirm';
                    }
                    if (value.name == 'Cancelations') {
                        $scope.User.roles[index].name = 'Reasons to Cancel';
                    }
                });
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/users');
            }
        );
    };

    $scope.delete = function () {
        if(confirm('Are you sure that you want to delete the record of this user?')) {
            OneSourceApi.request('users/' + $scope.User.id,'DELETE').then(
                function(response) {
                    handleMessages(response,response.status);
                    $location.path('/users');
                },
                function(error) {
                    handleMessages(error.data,error.status);
                }
            );
        }
    }

    $scope.loadCatalogs();
    $scope.getUser();
});