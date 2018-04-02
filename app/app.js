'use strict';

// Declare app level module which depends on views, and components
var webClient = angular.module('webClient', [
    'ngRoute',
    'ngCookies',
    'ngMask',
    'summernote',
    'ngSanitize',
    'webClient.bodyparts',
    'webClient.clients',
    'webClient.lawoffices',
    'webClient.clinics',
    'webClient.insurancecompanies',
    'webClient.attorneys',
    'webClient.doctors',
    'webClient.users',
    'webClient.regions',
    'webClient.confirmations',
    'webClient.cancelations',
    'webClient.sessions',
    'webClient.reports'
]).run(function($rootScope){
    $rootScope.$on( "$routeChangeStart", function(event, next, current) {
        if (next.originalPath == '/login') {
            jQuery('nav.navbar').hide();
        } else {
            jQuery('nav.navbar').fadeIn('slow');
        }
    });
});

webClient.config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/reports'});
}]);

webClient.factory('OneSourceApi',function($http,$q,$cookies){
    return {
        _baseurl: '/api/v1/',
        _params: '',
        _authorization: '',
        _access_token: $cookies.get('access_token'),
        request: function(endpoint,r_method,r_params,r_data,login){
            var url = this._baseurl;
            if (endpoint.indexOf(this._baseurl) != -1) {
                url = '';
            }
            var req = {};
            if (login) {
                req = {
                    method: r_method,
                    url: url + endpoint,
                    data: r_data,
                    params: r_params
                };
            } else {
                req = {
                    method: r_method,
                    url: url + endpoint,
                    headers: {
                        Authorization: 'Bearer ' + $cookies.get('access_token')
                    },
                    data: r_data,
                    params: r_params
                };
            }

            var defer = $q.defer();
            $http(req).then(
                function(response){
                    defer.resolve(response);
                },
                function(error){
                    defer.reject(error);
                }
            );
            return defer.promise;
        }
    };
});

webClient.directive('bsActiveLink', ['$location', function ($location) {
    return {
        restrict: 'A', //use as attribute
        replace: false,
        link: function (scope, elem) {
            //after the route has changed
            scope.$on("$routeChangeSuccess", function () {
                var hrefs = ['/#' + $location.path(),
                    '#' + $location.path(), //html5: false
                    $location.path()]; //html5: true
                angular.forEach(elem.find('a'), function (a) {
                    a = angular.element(a);
                    if (-1 !== hrefs.indexOf(a.attr('href'))) {
                        a.parent().addClass('active');
                    } else {
                        a.parent().removeClass('active');
                    };
                });
            });
        }
    }
}]);

webClient.factory('Authentication',function($http,$location,$cookies){
    return {
        checkAccessToken: function(){
            var access_token = $cookies.get('access_token');
            if (access_token) {
                return true;
            }
            return false;
        },
        checkModuleAccess: function(module,write){
            var modules = $cookies.getObject('accesses');
            if (modules) {
                // iterate through the accesses object to see if the module with the write access exists.
                for (var i = 0; i < modules.length; i++) {
                    var rol = modules[i];
                    rol.write = parseInt(rol.write);
                    if (rol.name == module && ((write == rol.write) || (rol.write == 1 && write == 0))) {
                        return true;
                    }
                }
            }
            return false;
        }
    };
});

webClient.directive('tableResults',function($timeout){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/table-results.html',
        link: function(scope,elem,attrs) {
            $timeout(function(){
                var headers = jQuery('.report a.ng-binding')
                jQuery.each(headers,function(i,item){
                    var headername = jQuery(item).attr('headername');
                    jQuery(item).click(function(){
                        scope.setOrder(headername);
                    });
                });
            },3000);
        }
    }
});

webClient.directive('checkAll',function(){
    return {
        restrict: 'E',
        replace: true,
        template: '<input title="Select All" type="checkbox" value="1" ng-click="selectAll()" id="checkAll">',
        controller: function($scope, $element) {
            $scope.selectAll = function() {
                if (jQuery('#checkAll').prop('checked')) {
                    jQuery('.allchks').prop('checked',true);
                } else {
                    jQuery('.allchks').prop('checked',false);
                }
            }
        }
    }
});

webClient.directive('deleteSelected',function(OneSourceApi,$route){
    return {
        restrict: 'E',
        replace: true,
        template: '<button class="btn btn-danger btn-sm pull-right" ng-click="deleteSelected()"><i class="fa fa-trash-o"></i> Delete</button>',
        controller: function($scope, $element, $attrs) {
            $scope.deleteSelected = function() {
                var records = [];
                var a = jQuery('.allchks:checked').map(function(){
                    records.push(parseInt(jQuery(this).val()));
                    return jQuery(this).val();
                });
                if (records.length > 0) {
                    if (confirm('Are you sure that you want to delete the selected record(s)?')) {
                        OneSourceApi.request($attrs.collection,'DELETE',{data:records.join(',')}).then(
                            function(response){
                                handleMessages(response,response.status);
                                $route.reload();
                            },
                            function(error){
                                handleMessages(error.data,error.status);
                            }
                        );
                    }
                } // end of if length > 0
            }
        }
    }
});

webClient.filter('range', function() {
    return function(input, min, max) {
        min = parseInt(min);
        max = parseInt(max);
        for (var i=min; i<=max; i++)
            input.push(i);
        return input;
    };
});

(function (angular) {
    'use strict';
    function printDirective() {
        var printSection = document.getElementById('printSection');
        // if there is no printing section, create one
        if (!printSection) {
            printSection = document.createElement('div');
            printSection.id = 'printSection';
            document.body.appendChild(printSection);
        }
        function link(scope, element, attrs) {
            element.on('click', function () {
                var elemToPrint = document.getElementById(attrs.printElementId);
                if (elemToPrint) {
                    printElement(elemToPrint);
                }
            });
            window.onafterprint = function () {
                // clean the print section before adding new content
                printSection.innerHTML = '';
            }
        }
        function printElement(elem) {
            // clones the element you want to print
            var domClone = elem.cloneNode(true);
            printSection.appendChild(domClone);
            window.print();
        }
        return {
            link: link,
            restrict: 'A'
        };
    }
    angular.module('webClient').directive('ngPrint', [printDirective]);
}(window.angular));

angular.module('webClient')
    .filter('to_trusted', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }]);