/**
 * Created by david on 7/28/15.
 */
var dashboard_mod = angular.module('webClient.dashboard',['ngRoute','ngCookies']);
dashboard_mod.config(function($routeProvider){
    $routeProvider.
        when('/dashboard',{
            controller: 'DashboardController',
            templateUrl: 'dashboard/index.html',
            resolve: {
                authentication: function (Authentication,$location) {
                    if (!Authentication.checkAccessToken()) {
                        $location.path('/login');
                    }
                }
            }
        }
    );
});

dashboard_mod.controller('DashboardController',function($scope,OneSourceApi){
    $scope.clients = {};
    $scope.attorneys = {};
    $scope.lawoffices = {};
    $scope.pagination = {};
    $scope.selected_lawoffices = [];
    $scope.selected_attorneys = [];
    $scope.firstSet = 1;
    $scope.data = {
        "appt_mindate": moment().startOf('month').subtract(1, 'months').format(),
        "appt_maxdate": moment().startOf('hour').format(),
        "dor_mindate": moment().startOf('month').subtract(1, 'months').format(),
        "dor_maxdate": moment().startOf('hour').format(),
        "sortBy": "date_of_referral",
        "sortOrder": "desc",
        "perPage": 100,
        "lawoffice": [],
        "attorney": [],
        "status": -1
    };

    $scope.searchAll = function(){
        OneSourceApi.request('search','POST',{},$scope.data).then(
            function(response){
                var _data = response.data;
                $scope.clients = response.data.data;
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
                $scope.firstSet = 0;
            },
            function(error){}
        );
    };
    $scope.getCatalogs = function(){
        OneSourceApi.request('catalogs','GET',{q:'attorneys,lawoffices'}).then(
            function(response){
                $scope.attorneys = response.data.data.attorneys;
                $scope.lawoffices = response.data.data.lawoffices;
            },function(error){}
        );
    };
    $scope.hasLawOffices = function() {
        if ($scope.data.lawoffice.length > 0) {
            return true;
        }
        return false;
    };
    $scope.hasAttorneys = function() {
        if ($scope.data.attorney.length > 0) {
            return true;
        }
        return false;
    };
    $scope.addLawOffices = function() {
        $scope.searchAll();
        $scope.selected_lawoffices = _.findByValues($scope.lawoffices, "id", $scope.data.lawoffice);
        $scope.selected_lawoffices = $scope.selected_lawoffices.join(', ');
    };
    $scope.addAttorneys = function() {
        $scope.searchAll();
        $scope.selected_attorneys = _.findByValues($scope.attorneys, "id", $scope.data.attorney);
        $scope.selected_attorneys = $scope.selected_attorneys.join(', ');
    };
    $scope.setStatus = function() {
        $scope.searchAll();
    };
    $scope.apptDate = function() {
        if ($scope.data.appt_mindate != $scope.data.appt_maxdate) {
            $scope.searchAll();
        }
    };
    $scope.dateOfReferral = function() {
        if ($scope.data.dor_mindate != $scope.data.dor_maxdate) {
            $scope.searchAll();
        }
    };
    $scope.$watch("data.appt_mindate",function(newValue, oldValue){
        if ($scope.firstSet == 1) {
            return false;
        }
        $scope.apptDate();
    });
    $scope.$watch("data.appt_maxdate",function(newValue, oldValue){
        if ($scope.firstSet == 1) {
            return false;
        }
        $scope.apptDate();
    });
    $scope.$watch("data.dor_mindate",function(newValue, oldValue){
        if ($scope.firstSet == 1) {
            return false;
        }
        $scope.dateOfReferral();
    });
    $scope.$watch("data.dor_maxdate",function(newValue, oldValue){
        if ($scope.firstSet == 1) {
            return false;
        }
        $scope.dateOfReferral();
    });
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
        if ($scope.q.length > 3 || $scope.q.length == 0){
            $scope.data.q = $scope.q;
            $scope.searchAll();
        }
    };
    $scope.isNewRecord = function(item){
        var created_date = moment(item.created_at).format('YYYY-MM-DD');
        var updated_date = moment(item.updated_at).format('YYYY-MM-DD');
        var today = moment().startOf('day').format('YYYY-MM-DD');
        if ((item.created_at === item.updated_at) && created_date == today) {
            return "info";
        }
        if ((item.created_at != item.updated_at) && updated_date == today) {
            return "warning";
        }
        if (item.confirmed !== null) {
            return "success";
        }
        if (item.cancelled !== null) {
            return "danger";
        }
        return "";
    };

    $scope.setOrder = function(sortby) {
        $scope.data.sortBy = sortby;
        if ($scope.data.sortOrder == 'desc') {
            $scope.data.sortOrder = 'asc';
        } else {
            $scope.data.sortOrder = 'desc';
        }
        $scope.searchAll();
    };

    $scope.searchAll();
    $scope.getCatalogs();
});