/**
 * Created by david on 9/13/15.
 */
var reports_mod = angular.module('webClient.reports',['ngRoute','ngCookies','datePicker','localytics.directives','angular-loading-bar','ui.sortable']);
reports_mod.config(function($routeProvider,cfpLoadingBarProvider){
    $routeProvider.
    when('/reports',{
        controller: 'ReportsController',
        templateUrl: 'reports/index.html',
        resolve: {
            authentication: function (Authentication,$location) {
                if (!Authentication.checkAccessToken()) {
                    $location.path('/login');
                }
            },
            access: function(Authentication, $location) {
                if (!Authentication.checkModuleAccess('Reports',0)) {
                    handleMessages({},403);
                    $location.path('/reports');
                }
            }
        }
    })
    .when('/reports/create',{
        controller: 'ReportsCreateController',
        templateUrl: 'reports/add.html',
        resolve: {
            authentication: function (Authentication,$location) {
                if (!Authentication.checkAccessToken()) {
                    $location.path('/login');
                }
            },
            access: function(Authentication, $location) {
                if (!Authentication.checkModuleAccess('Reports',1)) {
                    handleMessages({},403);
                    $location.path('/reports');
                }
            }
        }
    })
    .when('/reports/display/:id',{
        controller: 'ReportsDisplayController',
        templateUrl: 'reports/display.html'
    })
    .when('/reports/:id/edit',{
        controller: 'ReportsEditController',
        templateUrl: 'reports/edit.html',
        resolve: {
            authentication: function (Authentication,$location) {
                if (!Authentication.checkAccessToken()) {
                    $location.path('/login');
                }
            },
            access: function(Authentication, $location) {
                if (!Authentication.checkModuleAccess('Reports',1)) {
                    handleMessages({},403);
                    $location.path('/reports');
                }
            }
        }
    });
    cfpLoadingBarProvider.includeSpinner = false;
});

reports_mod.controller('ReportsController',function($scope,$routeParams,OneSourceApi,$filter,$location,$timeout,$cookies){

    $scope.report_id = $routeParams.id;
    $scope.clients = {};
    $scope.pagination = {};
    $scope.Reports = {};
    $scope.Report = 1;
    $scope.colspan = 1;
    $scope.columns_width = columns_width;
    $scope.all_columns = {};
    $scope.default_all_columns = {};
    $scope.Report.columns = {};
    $scope.default_columns = {};
    $scope.params = {
        "columns": [],
        "sortBy": "updated_at",
        "sortOrder": "desc",
        "perPage": 25,
        "q": ""
    };
    $scope.sortableOptions = {
        placeholder: "app",
        connectWith: ".apps-container"
    };
    $scope.fields = [
        {'field':'id','label':'Record ID'},
        {'field':'firstname','label':'First Name'},
        {'field':'lastname','label':'Last Name'},
        {'field':'dob','label':'Date of Birth'},
        {'field':'phone','label':'Phone'},
        {'field':'ssn','label':'SSN'},
        {'field':'clinic_name','label':'Clinic'},
        {'field':'doctor_name','label':'Doctor'},
        {'field':'lawoffice_name','label':'Law Office'},
        {'field':'attorney_name','label':'Attorney'},
        {'field':'insurance_name','label':'Insurance Company'}
    ];
    $scope.first_loaded = false;
    $scope.user = $cookies.getObject('user');
    $scope.grand_total = 0;

    $scope.getFields = function() {
        OneSourceApi.request('search/fields','GET').then(
            function(response){
                var _data = response.data.data;
                $scope.default_all_columns = _.clone(_data.all, true);;
                _.forEach(_data.default,function(item){
                    return _.remove(_data.all,item,'value');
                });
                $scope.all_columns = _data.all;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/reports');
            }
        );
    };

    $scope.getAll = function(endpoint){
        OneSourceApi.request(endpoint,'POST',{},$scope.params).then(
            function(response){
                var _data = response.data;
                $scope.clients = response.data.data;
                if (response.data.totals) {
                    $scope.totals = response.data.totals;
                    $scope.grand_total = 0;
                    angular.forEach($scope.totals,function(item,index){
                        $scope.grand_total = $scope.grand_total + parseInt(item.total);
                    });
                }
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
                if ($scope.Report === 1) {
                    $scope.Report = response.data.report.options;
                    $scope.report_id = response.data.report.id;
                    $scope.default_columns = response.data.report.options.columns;
                    $scope.colspan = response.data.report.options.columns.length;
                    if ($scope.Report.allow_view || $scope.Report.allow_edit) {
                        $scope.colspan = $scope.colspan + 1;
                    }
                    $scope.getFields();
                }
                $timeout(function(){
                    if($scope.first_loaded == false) {
                        sticky_headers();
                        $scope.first_loaded = true;
                        $scope.$apply();
                    }
                },1000);
            },
            function(error){
                $timeout(function(){
                    handleMessages(error.data,error.status);
                    if (jQuery('.sidebar').hasClass('sidebar-open') != true) {
                        jQuery('.sidebar').addClass('sidebar-open');
                    }
                });
            }
        );
    };
    $scope.firstPage = function(){
        if ($scope.pagination.current_page > 1) {
            $scope.getAll($scope.pagination.current_request + 'page=1','POST');
        } else {return false;}
    };
    $scope.prevPage = function(){
        if ($scope.pagination.prev_page_url) {
            $scope.getAll($scope.pagination.prev_page_url,'POST');
        } else {return false;}
    };
    $scope.nextPage = function(){
        if ($scope.pagination.next_page_url) {
            $scope.getAll($scope.pagination.next_page_url,'POST');
        } else {return false;}
    };
    $scope.lastPage = function(){
        if ($scope.pagination.current_page < $scope.pagination.last_page) {
            $scope.getAll($scope.pagination.current_request + 'page=' + $scope.pagination.last_page,'POST');
        } else {return false;}
    };
    $scope.gotoPage = function(_page){
        if (parseInt(_page) >= 1 && parseInt(_page) <= $scope.pagination.total){
            $scope.getAll($scope.pagination.current_request + 'page=' + _page,'POST');
        } else {return false;}
    };

    $scope.restoreDefault = function() {
        $scope.Report.columns = $scope.default_columns;
        $scope.all_columns = $scope.default_all_columns;
    };

    $scope.useAllColumns = function() {
        $scope.Report.columns = $scope.all_columns;
        $scope.all_columns = [];
    };

    $scope.setColumns = function() {
        $scope.params.columns = $scope.Report.columns;
        $scope.colspan = $scope.Report.columns.length;
        if ($scope.Report.allow_view || $scope.Report.allow_edit) {
            $scope.colspan = $scope.colspan + 1;
        }
        $scope.getAll('reports/default');
        jQuery('#modal_columns').modal('hide');
    }

    $scope.getReports = function() {
        OneSourceApi.request('reports', 'GET').then(
            function (response) {
                $scope.Reports = response.data.data;
            },
            function (error) {
            }
        );
    };

    $scope.getColumnDOB = function(column_name) {
        if (column_name == 'dob') {
            return true;
        }
        return false;
    };

    $scope.getColumnString = function(column_name) {
        if (column_name != 'date_of_referral'
            && column_name != 'date_received'
            && column_name != 'dob'
            && column_name != 'appt_date'
            && column_name != 'first_seen'
            && column_name != 'patient_treating'
            && column_name != 'is_doctor_mpn'
        ) {
            return true;
        }
        return false;
    };

    $scope.getColumnDate = function(column_name) {
        if (column_name == 'date_of_referral'
            || column_name == 'date_received'
            || column_name == 'appt_date'
            || column_name == 'date_moved'
            || column_name == 'first_seen'
        ) {
            return true;
        }
        return false;
    };

    $scope.getColumnBool = function(column_name) {
        if (column_name == 'patient_treating'
            || column_name == 'is_doctor_mpn'
        ) {
            return true;
        }
        return false;
    }

    $scope.setOrder = function(sortby) {
        $scope.params.sortBy = sortby;
        if ($scope.params.sortOrder == 'desc') {
            $scope.params.sortOrder = 'asc';
        } else {
            $scope.params.sortOrder = 'desc';
        }
        $scope.getAll('reports/default');
    };

    $scope.isNewRecord = function(item,index){
        var created_date = moment(item.created_at).format('YYYY-MM-DD');
        var updated_date = moment(item.updated_at).format('YYYY-MM-DD');
        var today = moment().startOf('day').format('YYYY-MM-DD');
        if (item.confirmed !== null && index == 0) {
            return "td-success";
        }
        if (item.cancelled !== null && index == 0) {
            return "td-danger";
        }
        if ((item.created_at === item.updated_at) && created_date == today && index == 0) {
            return "td-info";
        }
        if ((item.created_at != item.updated_at) && updated_date == today && index == 0) {
            return "td-warning";
        }
        return "";
    };

    $scope.getExcel = function() {
        var i_frame = jQuery('#exportframe');
        i_frame.prop('src','/api/v1/reports/export/' + $scope.report_id + '?access_token=' + $cookies.get('access_token'));
    };

    $scope.search = function(){

        var _isdate = new RegExp("^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$");

        if ($scope.q.length > 3){
            if ($scope.search_field == 'dob') {
                if (_isdate.test($scope.q) === false) {
                    jQuery.noty.closeAll();
                    _noty = noty({text: 'Not a valid date. Please type the date this way: m/d/y', type: 'error', timeout: 8000});
                    return false;
                }
            }
            if ($scope.search_field == 'id') {
                if (isNaN($scope.q)) {
                    jQuery.noty.closeAll();
                    _noty = noty({text: 'Not a valid Record ID. Please type a number.', type: 'error', timeout: 8000});
                    return false;
                } else {
                    $scope.q = parseInt($scope.q);
                }
            }
            if ($scope.search_field == 'dob') {
                var _thedate = $scope.q.split('/');
                // validate month and day
                var _month = parseInt(_thedate[0]);
                var _day = parseInt(_thedate[1]);
                if (_month > 12 || _day > 31 || (_month == 2 && _day > 28)) {
                    jQuery.noty.closeAll();
                    _noty = noty({text: 'Not a valid date. Please type the date this way: m/d/y', type: 'error', timeout: 8000});
                    return false;
                }
                $scope.params.q = _thedate[2] + '-' + _thedate[0] + '-' + _thedate[1];
            } else {
                $scope.params.q = $scope.q;
            }
            $scope.params.search_field = $scope.search_field;
            $scope.getAll('reports/default');
        }
        if ($scope.q.length == 0){
            $scope.params.search_field = null;
            $scope.params.q = '';
            $scope.getAll('reports/default');
        }
    };

    $scope.printReport = function() {
        var win = window.open('/api/v1/reports/print/' + $scope.report_id + '?access_token=' + $cookies.get('access_token'));
    }

    $scope.getReports();
    $scope.getAll('reports/default');
});

reports_mod.controller('ReportsCreateController',function($scope,$routeParams,OneSourceApi,$filter,$location){
    $scope.Reports = {};
    $scope.reportForm = {};
    $scope.Report = {
        type: "table",
        share_type: "0",
        filters: [],
        sort: []
    };
    $scope.string_conditions = [
        {"value":"equals","text":"Equals to"},
        {"value":"not_equals","text":"is Not Equal to"},
        {"value":"ilike","text":"Contains"},
        {"value":"starts_with","text":"Starts with"},
        {"value":"ends_with","text":"Ends with"}
    ];
    $scope.date_conditions = [
        {"value":"equals","text":"Equals to"},
        {"value":"on_after","text":"On or After to"},
        {"value":"after","text":"After to"},
        {"value":"before_on","text":"Before or On to"},
        {"value":"before","text":"Before to"},
        {"value":"is_months_past","text":"is equal to month(s) in the past"},
        {"value":"is_days_past","text":"is equal to day(s) in the past"},
        {"value":"is_yesterday","text":"is equal to yesterday"},
        {"value":"is_today","text":"is equal to today"},
        {"value":"is_tomorrow","text":"is equal to tomorrow"},
        {"value":"is_days_future","text":"is equal to day(s) in the future"},
        {"value":"is_months_future","text":"is equal to month(s) in the future"},
        {"value":"is_this_month","text":"is equal to this month"}
    ];
    $scope.select_conditions = [
        {"value":"in","text":"Any of the following value(s)"},
        {"value":"not_in","text":"Is none of the following value(s)"},
        {"value":"not_null","text":"Some value is set"},
        {"value":"is_null","text":"No value is set"}
    ];
    $scope.sort_options = [
        {"value":"sort_low_high","text":"Sort from low to high by"},
        {"value":"sort_high_low","text":"Sort from high to low by"},
        {"value":"sort_group_low_high","text":"Sort and Group from low to high by"},
        {"value":"sort_group_high_low","text":"Sort and Group from high to low by"}
    ];
    $scope.date_grouping = [
        {'value':'day','text':'Day'},
        {'value':'week','text':'Week'},
        {'value':'month','text':'Month'},
        {'value':'quarter','text':'Quarter'},
        {'value':'year','text':'Year'},
        {'value':'decade','text':'Decade'}
    ];
    $scope.yesno_options = [
        {"value":1,"text":"Yes"},
        {"value":0,"text":"No"},
    ];
    $scope.conditions = [{"value":"","text":""}];
    $scope.all_columns = {};
    $scope.default_all_columns = {};
    $scope.Report.columns = {};
    $scope.default_columns = {};
    $scope.filtering = 0;
    $scope.sorting = 0;
    $scope.sortableOptions = {
        placeholder: "app",
        connectWith: ".apps-container"
    };
    $scope.catalogs = {};
    $scope.catalog_options = {};
    $scope.bodyparts = {};
    $scope.clinics = {};
    $scope.cities = {};
    $scope.doctors = {};
    $scope.attorneys = {};
    $scope.lawoffices = {};
    $scope.confirmations = {};
    $scope.cancelations = {};
    $scope.createdby = {};
    $scope.updatedby = {};


    $scope.getFields = function() {
        OneSourceApi.request('search/fields','GET').then(
            function(response){
                var _data = response.data.data;
                $scope.default_all_columns = _.clone(_data.all, true);;
                _.forEach(_data.default,function(item){
                    return _.remove(_data.all,item,'value');
                });
                $scope.all_columns = _data.all;
                $scope.Report.columns = _data.default;
                $scope.default_columns = _data.default;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/reports');
            }
        );
    };

    $scope.getCatalogs = function () {
        OneSourceApi.request('catalogs','GET',{q:'cities,clinics,lawoffices,doctors,attorneys,bodyparts,confirmations,cancelations,users',extended:1,withtrashed:1}).then(
            function(response){
                $scope.catalogs = response.data.data;
                $scope.bodyparts = response.data.data.bodyparts;
                $scope.clinics = response.data.data.clinics;
                $scope.cities = response.data.data.cities;
                $scope.doctors = response.data.data.doctors;
                $scope.attorneys = response.data.data.attorneys;
                $scope.lawoffices = response.data.data.lawoffices;
                $scope.confirmations = response.data.data.confirmations;
                $scope.cancelations = response.data.data.cancelations;
                $scope.createdby = response.data.data.users;
                $scope.updatedby = response.data.data.users;
            },function(error){}
        );
    };

    $scope.restoreDefault = function() {
        $scope.Report.columns = $scope.default_columns;
        $scope.all_columns = $scope.default_all_columns;
    };

    $scope.useAllColumns = function() {
        $scope.Report.columns = $scope.all_columns;
        $scope.all_columns = [];
    };

    $scope.setConditions = function(index) {
        if ($scope.Report.filters[index].field === 'date_of_referral'
            || $scope.Report.filters[index].field === 'date_received'
            || $scope.Report.filters[index].field === 'dob'
            || $scope.Report.filters[index].field === 'appt_date'
            || $scope.Report.filters[index].field === 'date_moved'
            || $scope.Report.filters[index].field === 'first_seen'
        ) {
            return 1;
        } else if($scope.Report.filters[index].field == 'body_parts'
            || $scope.Report.filters[index].field == 'clinic_name'
            || $scope.Report.filters[index].field == 'doctor_name'
            || $scope.Report.filters[index].field == 'attorney_name'
            || $scope.Report.filters[index].field == 'lawoffice_name'
            || $scope.Report.filters[index].field == 'confirmed'
            || $scope.Report.filters[index].field == 'cancelled'
            || $scope.Report.filters[index].field == 'created_by'
            || $scope.Report.filters[index].field == 'updated_by'
        ) {
            return 2;
        } else {
            return 3;
        }
    };

    $scope.getConditions = function(index) {
        if ($scope.Report.filters[index].field === 'date_of_referral'
            || $scope.Report.filters[index].field === 'date_received'
            || $scope.Report.filters[index].field === 'dob'
            || $scope.Report.filters[index].field === 'appt_date'
            || $scope.Report.filters[index].field === 'date_moved'
            || $scope.Report.filters[index].field === 'first_seen'
        ) {
            return 1; // this is for dates.
        } else if($scope.Report.filters[index].field === 'body_parts') {
            return 2;
        } else if ($scope.Report.filters[index].field === 'clinic_name') {
            return 3
        } else if ($scope.Report.filters[index].field === 'doctor_name') {
            return 4
        } else if($scope.Report.filters[index].field === 'attorney_name') {
            return 5;
        } else if ($scope.Report.filters[index].field === 'lawoffice_name') {
            return 6;
        } else if ($scope.Report.filters[index].field === 'confirmed') {
            return 7;
        } else if ($scope.Report.filters[index].field === 'cancelled') {
            return 8;
        } else if ($scope.Report.filters[index].field === 'created_by') {
            return 9;
        } else if ($scope.Report.filters[index].field === 'updated_by') {
            return 10
        } else if ($scope.Report.filters[index].field === 'city') {
            return 12;
        } else if ($scope.Report.filters[index].field === 'is_doctor_mpn' || $scope.Report.filters[index].field === 'patient_treating') {
            return 13;
        } else {
            return 11; // this is for text field.
        }
        return 0;
    };

    $scope.getGroupDate = function(index) {
        var reggroup = new RegExp('^(sort_group_)');
        if (reggroup.test($scope.Report.sort[index].order)
            && ($scope.Report.sort[index].field === 'date_of_referral'
            || $scope.Report.sort[index].field === 'date_received'
            || $scope.Report.sort[index].field === 'dob'
            || $scope.Report.sort[index].field === 'appt_date'
            || $scope.Report.sort[index].field === 'date_moved'
            || $scope.Report.sort[index].field === 'first_seen')) {
            return true;
        }
        $scope.Report.sort[index].value = null;
        return false;
    };

    $scope.DaysDate = function(index) {
        var regexp = new RegExp('^(is_)');
        if (regexp.test($scope.Report.filters[index].condition)) {
            return true;
        }
        return false;
    }

    $scope.setCondValue = function(index) {
        if ($scope.Report.filters[index].condition == 'is_yesterday' || $scope.Report.filters[index].condition == 'is_tomorrow') {
            $scope.Report.filters[index].value = 1;
        }
        if ($scope.Report.filters[index].condition == 'is_today' || $scope.Report.filters[index].condition == 'is_this_month') {
            $scope.Report.filters[index].value = 0;
        }
    }

    $scope.removeFilter = function(index) {
        $scope.Report.filters.splice(index,1);
        if ($scope.Report.filters.length == 0) {
            $scope.filtering = 0;
            $scope.Report.filters = [];
        }
    };

    $scope.addFilter = function () {
        $scope.Report.filters.push({"field":"","condition":"","value":""});
    };

    $scope.removeSorting = function(index) {
        $scope.Report.sort.splice(index,1);
        if ($scope.Report.sort.length == 0) {
            $scope.sorting = 0;
            $scope.Report.sort = [];
        }
    };

    $scope.addSorting = function () {
        $scope.Report.sort.push({"field":"","value":""});
    };

    $scope.getFormFieldClass = function(formField){
        if(formField == undefined) return false;
        if (formField.$pristine) return "has-error";
        return formField.$valid? "has-success" : "has-error" ;
    };

    $scope.hasErrors = function(){
        if ($scope.reportForm.$pristine) return false;
        return $scope.reportForm.$invalid;
    };

    $scope.setFilters = function () {
        if ($scope.filtering == 1) {
            return true;
        } else {
            return false;
        }
    }

    $scope.setSorting = function () {
        if ($scope.sorting == 1) {
            return true;
        } else {
            return false;
        }
    }

    $scope.submitReport = function () {
        // if sharing options equals 1, we need to verify that at least one user is selected.
        if ($scope.Report.share_type == 1 && ($scope.Report.access == null)) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please select at least one user to share this report with.', type: 'error'});
            return false;
        }
        // if no columns selected, then return false.
        if ($scope.Report.columns.length == 0) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please select at least one column to show in this report.', type: 'error'});
            return false;
        }
        // if filtering equals to 1 then look for filters.
        if ($scope.filtering == 1 && ($scope.Report.filters.length == 0 || $scope.Report.filters == null)) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please set up a filter for this report or select "Show all records".', type: 'error'});
            return false;
        }
        if ($scope.filtering == 1 && $scope.Report.filter_match == null) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please select what condition to apply to each of the filters or select "Show all records".', type: 'error'});
            return false;
        }
        // if sorting equals to 1 then look for filters.
        if ($scope.sorting == 1 && ($scope.Report.sort.length == 0 || $scope.Report.sort == null)) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please set up a column to sort or group this report or select "Sort by default column".', type: 'error'});
            return false;
        }
        if ($scope.reportForm.$invalid) {
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        if ($scope.Report.share_type <= 0) {
            $scope.Report.access = [];
        }

        if ($scope.filtering == 0) {
            $scope.Report.filters = [];
        }

        if ($scope.sorting == 0) {
            $scope.Report.sort = [];
        }
        angular.forEach($scope.Report.filters, function(item,index){
            if ($scope.Report.filters[index].field == 'date_of_referral'
                || $scope.Report.filters[index].field == 'date_received'
                || $scope.Report.filters[index].field == 'dob'
                || $scope.Report.filters[index].field == 'appt_date'
                || $scope.Report.filters[index].field === 'date_moved'
                || $scope.Report.filters[index].field == 'first_seen'
            ) {
                if (angular.isNumber($scope.Report.filters[index].value) == false) {
                    $scope.Report.filters[index].value = $filter('date')($scope.Report.filters[index].value, 'yyyy-MM-dd');
                } else {
                    $scope.Report.filters[index].value = parseInt($scope.Report.filters[index].value);
                }
            }
        });
        OneSourceApi.request('reports','POST',{},$scope.Report).then(
            function(response){
                handleMessages(response,200);
                var _data = response.data.data;
                $location.path('/reports/display/' + _data.id);
            },function(error){}
        );

    };

    $scope.getFields();
    $scope.getCatalogs();
});

reports_mod.controller('ReportsEditController',function($scope,$routeParams,OneSourceApi,$filter,$location){
    $scope.Reports = {};
    $scope.report_id = $routeParams.id;
    $scope.reportForm = {};
    $scope.Report = {
        type: "table",
        share_type: "0",
        filters: [],
        sort: []
    };
    $scope.string_conditions = [
        {"value":"equals","text":"Equals to"},
        {"value":"not_equals","text":"is Not Equal to"},
        {"value":"ilike","text":"Contains"},
        {"value":"starts_with","text":"Starts with"},
        {"value":"ends_with","text":"Ends with"}
    ];
    $scope.date_conditions = [
        {"value":"equals","text":"Equals to"},
        {"value":"on_after","text":"On or After to"},
        {"value":"after","text":"After to"},
        {"value":"before_on","text":"Before or On to"},
        {"value":"before","text":"Before to"},
        {"value":"is_months_past","text":"Is equal to month(s) in the past"},
        {"value":"is_days_past","text":"Is equal to day(s) in the past"},
        {"value":"is_yesterday","text":"Is equal to yesterday"},
        {"value":"is_today","text":"Is equal to today"},
        {"value":"is_tomorrow","text":"Is equal to tomorrow"},
        {"value":"is_days_future","text":"Is equal to day(s) in the future"},
        {"value":"is_months_future","text":"Is equal to month(s) in the future"},
        {"value":"is_this_month","text":"Is equal to this month"}
    ];
    $scope.select_conditions = [
        {"value":"in","text":"Any of the following value(s)"},
        {"value":"not_in","text":"Is none of the following value(s)"},
        {"value":"not_null","text":"Some value is set"},
        {"value":"is_null","text":"No value is set"}
    ];
    $scope.sort_options = [
        {"value":"sort_low_high","text":"Sort from low to high by"},
        {"value":"sort_high_low","text":"Sort from high to low by"},
        {"value":"sort_group_low_high","text":"Sort and Group from low to high by"},
        {"value":"sort_group_high_low","text":"Sort and Group from high to low by"}
    ];
    $scope.match_options = [
        {"value":"AND","text":"All"},
        {"value":"OR","text":"Any"}
    ];
    $scope.conditions = [{"value":"","text":""}];
    $scope.all_columns = {};
    $scope.default_all_columns = {};
    $scope.Report.columns = {};
    $scope.default_columns = {};
    $scope.filtering = 0;
    $scope.sorting = 0;
    $scope.sortableOptions = {
        placeholder: "app",
        connectWith: ".apps-container"
    };
    $scope.catalogs = {};
    $scope.catalog_options = {};
    $scope.bodyparts = {};
    $scope.clinics = {};
    $scope.cities = {};
    $scope.doctors = {};
    $scope.attorneys = {};
    $scope.lawoffices = {};
    $scope.confirmations = {};
    $scope.cancelations = {};
    $scope.createdby = {};
    $scope.updatedby = {};
    $scope.date_grouping = [
        {'value':'day','text':'Day'},
        {'value':'week','text':'Week'},
        {'value':'month','text':'Month'},
        {'value':'quarter','text':'Quarter'},
        {'value':'year','text':'Year'},
        {'value':'decade','text':'Decade'}
    ];

    $scope.yesno_options = [
        {"value":1,"text":"Yes"},
        {"value":0,"text":"No"},
    ];

    $scope.getReports = function() {
        OneSourceApi.request('reports','GET').then(
            function(response){
                $scope.Reports = response.data.data;
            },
            function(error){}
        );
    }

    $scope.getFields = function() {
        OneSourceApi.request('search/fields','GET').then(
            function(response){
                var _data = response.data.data;
                $scope.default_all_columns = _.clone(_data.all, true);
                $scope.default_columns = _data.default;

                OneSourceApi.request('reports/' + $routeParams.id,'GET').then(
                    function(response){
                        $scope.Report = response.data.data.options;
                        $scope.all_columns = _.clone($scope.default_all_columns, true);
                        _.forEach($scope.Report.columns,function(item){
                            return _.remove($scope.all_columns,item,'value');
                        });
                        if ($scope.Report.filters != null) {
                            $scope.filtering = 1;
                        }
                        if ($scope.Report.sort.length > 0) {
                            $scope.sorting = 1;
                        }
                    },function(error){
                        handleMessages(error.data,error.status);
                        $location.path('/reports');
                    }
                );

            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/reports');
            }
        );
    };

    $scope.getCatalogs = function () {
        OneSourceApi.request('catalogs','GET',{q:'cities,clinics,lawoffices,doctors,attorneys,bodyparts,confirmations,cancelations,users',extended:1}).then(
            function(response){
                $scope.catalogs = response.data.data;
                $scope.bodyparts = response.data.data.bodyparts;
                $scope.clinics = response.data.data.clinics;
                $scope.cities = response.data.data.cities;
                $scope.doctors = response.data.data.doctors;
                $scope.attorneys = response.data.data.attorneys;
                $scope.lawoffices = response.data.data.lawoffices;
                $scope.confirmations = response.data.data.confirmations;
                $scope.cancelations = response.data.data.cancelations;
                $scope.createdby = response.data.data.users;
                $scope.updatedby = response.data.data.users;
            },function(error){}
        );
    };

    $scope.restoreDefault = function() {
        $scope.Report.columns = $scope.default_columns;
        $scope.all_columns = $scope.default_all_columns;
    };

    $scope.useAllColumns = function() {
        $scope.Report.columns = $scope.all_columns;
        $scope.all_columns = [];
    };

    $scope.setConditions = function(index) {
        if ($scope.Report.filters[index].field === 'date_of_referral'
            || $scope.Report.filters[index].field === 'date_received'
            || $scope.Report.filters[index].field === 'dob'
            || $scope.Report.filters[index].field === 'appt_date'
            || $scope.Report.filters[index].field === 'date_moved'
            || $scope.Report.filters[index].field === 'first_seen'
        ) {
            return 1;
        } else if($scope.Report.filters[index].field == 'body_parts'
            || $scope.Report.filters[index].field == 'clinic_name'
            || $scope.Report.filters[index].field == 'doctor_name'
            || $scope.Report.filters[index].field == 'attorney_name'
            || $scope.Report.filters[index].field == 'lawoffice_name'
            || $scope.Report.filters[index].field == 'confirmed'
            || $scope.Report.filters[index].field == 'cancelled'
            || $scope.Report.filters[index].field == 'created_by'
            || $scope.Report.filters[index].field == 'updated_by'
        ) {
            return 2;
        } else {
            return 3;
        }
    };

    $scope.getConditions = function(index) {
        if ($scope.Report.filters[index].field === 'date_of_referral'
            || $scope.Report.filters[index].field === 'date_received'
            || $scope.Report.filters[index].field === 'dob'
            || $scope.Report.filters[index].field === 'appt_date'
            || $scope.Report.filters[index].field === 'date_moved'
            || $scope.Report.filters[index].field === 'first_seen'
        ) {
            return 1; // this is for dates.
        } else if($scope.Report.filters[index].field === 'body_parts') {
            return 2;
        } else if ($scope.Report.filters[index].field === 'clinic_name') {
            return 3
        } else if ($scope.Report.filters[index].field === 'doctor_name') {
            return 4
        } else if($scope.Report.filters[index].field === 'attorney_name') {
            return 5;
        } else if ($scope.Report.filters[index].field === 'lawoffice_name') {
            return 6;
        } else if ($scope.Report.filters[index].field === 'confirmed') {
            return 7;
        } else if ($scope.Report.filters[index].field === 'cancelled') {
            return 8;
        } else if ($scope.Report.filters[index].field === 'created_by') {
            return 9;
        } else if ($scope.Report.filters[index].field === 'updated_by') {
            return 10
        } else if ($scope.Report.filters[index].field === 'city') {
            return 12;
        } else if ($scope.Report.filters[index].field === 'is_doctor_mpn' || $scope.Report.filters[index].field === 'patient_treating') {
            return 13;
        } else {
            return 11; // this is for text field.
        }
        return 12;
    };

    $scope.getGroupDate = function(index) {
        var reggroup = new RegExp('^(sort_group_)');
        if (reggroup.test($scope.Report.sort[index].order)
            && ($scope.Report.sort[index].field === 'date_of_referral'
            || $scope.Report.sort[index].field === 'date_received'
            || $scope.Report.sort[index].field === 'dob'
            || $scope.Report.sort[index].field === 'appt_date'
            || $scope.Report.sort[index].field == 'date_moved'
            || $scope.Report.sort[index].field === 'first_seen')) {
            return true;
        }
        $scope.Report.sort[index].value = null;
        return false;
    };

    $scope.DaysDate = function(index) {
        var regexp = new RegExp('^(is_)');
        if (regexp.test($scope.Report.filters[index].condition)) {
            return true;
        }
        return false;
    }

    $scope.setCondValue = function(index) {
        if ($scope.Report.filters[index].condition == 'is_yesterday' || $scope.Report.filters[index].condition == 'is_tomorrow') {
            $scope.Report.filters[index].value = 1;
        }
        if ($scope.Report.filters[index].condition == 'is_today' || $scope.Report.filters[index].condition == 'is_this_month') {
            $scope.Report.filters[index].value = 0;
        }
    }

    $scope.CheckNullCond = function(index) {
        if ($scope.Report.filters[index].condition == 'is_null' || $scope.Report.filters[index].condition == 'not_null') {
            return true;
        }
        return false;
    };

    $scope.removeFilter = function(index) {
        $scope.Report.filters.splice(index,1);
        if ($scope.Report.filters.length == 0) {
            $scope.filtering = 0;
            $scope.Report.filters = [];
        }
    };

    $scope.addFilter = function () {
        $scope.Report.filters.push({"field":"","condition":"","value":""});
    };

    $scope.removeSorting = function(index) {
        $scope.Report.sort.splice(index,1);
        if ($scope.Report.sort.length == 0) {
            $scope.sorting = 0;
            $scope.Report.sort = [];
        }
    };

    $scope.addSorting = function () {
        $scope.Report.sort.push({"field":"","value":""});
    };

    $scope.getFormFieldClass = function(formField){
        if(formField == undefined) return false;
        if (formField.$pristine) return "";
        return formField.$valid? "has-success" : "has-error";
    };

    $scope.hasErrors = function(){
        if ($scope.reportForm.$pristine) return false;
        return $scope.reportForm.$invalid;
    };

    $scope.setFilters = function () {
        if ($scope.filtering == 1) {
            return true;
        } else {
            return false;
        }
    }

    $scope.setSorting = function () {
        if ($scope.sorting == 1) {
            return true;
        } else {
            return false;
        }
    }

    $scope.delete = function() {
        if (confirm('Are you sure that you want to delete this report? This action cannot be undone.')) {
            OneSourceApi.request('reports/' + $scope.report_id,'DELETE').then(
                function(response) {
                    handleMessages(response,response.data.info.code);
                    $location.path('/reports');
                },
                function(error) {
                    handleMessages(error.data,error.status);
                }
            );
        }
    };

    $scope.submitReport = function () {
        // if sharing options equals 1, we need to verify that at least one user is selected.
        if ($scope.Report.share_type == 1 && ($scope.Report.access == null)) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please select at least one user to share this report with.', type: 'error'});
            return false;
        }
        // if no columns selected, then return false.
        if ($scope.Report.columns.length == 0) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please select at least one column to show in this report.', type: 'error'});
            return false;
        }
        // if filtering equals to 1 then look for filters.
        if ($scope.filtering == 1 && ($scope.Report.filters.length == 0 || $scope.Report.filters == null)) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please set up a filter for this report or select "Show all records".', type: 'error'});
            return false;
        }
        if ($scope.filtering == 1 && $scope.Report.filter_match == null) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please select what condition to apply to each of the filters or select "Show all records".', type: 'error'});
            return false;
        }
        // if sorting equals to 1 then look for filters.
        if ($scope.sorting == 1 && ($scope.Report.sort.length == 0 || $scope.Report.sort == null)) {
            jQuery.noty.closeAll();
            _noty = noty({text: 'Please set up a column to sort or group this report or select "Sort by default column".', type: 'error'});
            return false;
        }
        if ($scope.reportForm.$invalid) {
            jQuery.noty.closeAll();
            _noty = noty({text: validation_errors, type: 'error'});
            return false;
        }
        if ($scope.Report.share_type <= 0) {
            $scope.Report.access = [];
        }
        if ($scope.filtering == 0) {
            $scope.Report.filters = [];
        }
        if ($scope.sorting == 0) {
            $scope.Report.sort = [];
        }
        angular.forEach($scope.Report.filters, function(item,index){
            if ($scope.Report.filters[index].field == 'date_of_referral'
                || $scope.Report.filters[index].field == 'date_received'
                || $scope.Report.filters[index].field == 'dob'
                || $scope.Report.filters[index].field == 'appt_date'
                || $scope.Report.filters[index].field === 'date_moved'
                || $scope.Report.filters[index].field == 'first_seen'
            ) {
                if (angular.isNumber($scope.Report.filters[index].value) == false) {
                    $scope.Report.filters[index].value = $filter('date')($scope.Report.filters[index].value, 'yyyy-MM-dd');
                } else {
                    $scope.Report.filters[index].value = parseInt($scope.Report.filters[index].value);
                }
            }
        });
        OneSourceApi.request('reports/' + $routeParams.id,'PUT',{},$scope.Report).then(
            function(response){
                handleMessages(response,response.data.info.code);
                $location.path('/reports/display/' + $scope.report_id);
            },function(error){
                handleMessages(error.data,error.status);
                //$location.path('/reports');
            }
        );

    };

    $scope.getFields();
    $scope.getCatalogs();
    $scope.getReports();
});

reports_mod.controller('ReportsDisplayController',function($scope,$routeParams,OneSourceApi,$timeout,$location,$cookies){
    $scope.report_id = $routeParams.id;
    $scope.clients = {};
    $scope.pagination = {};
    $scope.Reports = {};
    $scope.Report = 1;
    $scope.totals = [];
    $scope.colspan = 1;
    $scope.columns_width = columns_width;
    $scope.all_columns = {};
    $scope.default_all_columns = {};
    $scope.Report.columns = {};
    $scope.default_columns = {};
    $scope.params = {
        "columns": [],
        "sortBy": "updated_at",
        "sortOrder": "desc",
        "perPage": 25,
        "q": ""
    };
    $scope.sortableOptions = {
        placeholder: "app",
        connectWith: ".apps-container"
    };
    $scope.fields = [
        {'field':'id','label':'Record ID'},
        {'field':'firstname','label':'First Name'},
        {'field':'lastname','label':'Last Name'},
        {'field':'dob','label':'Date of Birth'},
        {'field':'phone','label':'Phone'},
        {'field':'ssn','label':'SSN'},
        {'field':'clinic_name','label':'Clinic'},
        {'field':'doctor_name','label':'Doctor'},
        {'field':'lawoffice_name','label':'Law Office'},
        {'field':'attorney_name','label':'Attorney'},
        {'field':'insurance_name','label':'Insurance Company'}
    ];
    $scope.first_loaded = false;
    $scope.user = $cookies.getObject('user');

    $scope.getFields = function() {
        OneSourceApi.request('search/fields','GET').then(
            function(response){
                var _data = response.data.data;
                $scope.default_all_columns = _.clone(_data.all, true);;
                _.forEach(_data.default,function(item){
                    return _.remove(_data.all,item,'value');
                });
                $scope.all_columns = _data.all;
            },
            function(error){
                handleMessages(error.data,error.status);
                $location.path('/reports');
            }
        );
    };

    $scope.getAll = function(endpoint){
        OneSourceApi.request(endpoint,'POST',{},$scope.params).then(
            function(response){
                var _data = response.data;
                $scope.clients = response.data.data;
                if (response.data.totals) {
                    $scope.totals = response.data.totals;
                    $scope.grand_total = 0;
                    angular.forEach($scope.totals,function(item,index){
                        $scope.grand_total = $scope.grand_total + parseInt(item.total);
                    });
                }
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
                if ($scope.Report === 1) {
                    $scope.Report = response.data.report.options;
                    $scope.default_columns = response.data.report.options.columns;
                    $scope.colspan = response.data.report.options.columns.length;
                    if ($scope.Report.allow_view || $scope.Report.allow_edit) {
                        $scope.colspan = $scope.colspan + 1;
                    }
                    $scope.getFields();
                }
                $timeout(function(){
                    if($scope.first_loaded == false) {
                        sticky_headers();
                        $scope.first_loaded = true;
                        $scope.$apply();
                    }
                },1000);
            },
            function(error){
                $timeout(function(){
                    handleMessages(error.data,error.status);
                });
            }
        );
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

    $scope.restoreDefault = function() {
        $scope.Report.columns = $scope.default_columns;
        $scope.all_columns = $scope.default_all_columns;
    };

    $scope.useAllColumns = function() {
        $scope.Report.columns = $scope.all_columns;
        $scope.all_columns = [];
    };

    $scope.setColumns = function() {
        $scope.params.columns = $scope.Report.columns;
        $scope.colspan = $scope.Report.columns.length;
        if ($scope.Report.allow_view || $scope.Report.allow_edit) {
            $scope.colspan = $scope.colspan + 1;
        }
        $scope.first_loaded = false;
        $scope.getAll('reports/display/' + $scope.report_id);
        jQuery('#modal_columns').modal('hide');
    };

    $scope.getReports = function() {
        OneSourceApi.request('reports','GET').then(
            function(response){
                $scope.Reports = response.data.data;
            },
            function(error){}
        );
    };

    $scope.getCurrentReport = function() {
        OneSourceApi.request('reports/' + $routeParams.id,'GET').then(
            function(response){
                $scope.Report = response.data.data.options;
                $scope.all_columns = _.clone($scope.default_all_columns, true);
                _.forEach($scope.Report.columns,function(item){
                    return _.remove($scope.all_columns,item,'value');
                });
                if ($scope.Report.filters != null) {
                    $scope.filtering = 1;
                }
                if ($scope.Report.sort != null) {
                    $scope.sorting = 1;
                }
                $scope.colspan = $scope.Report.columns.length;
                if ($scope.Report.allow_view || $scope.Report.allow_edit) {
                    $scope.colspan = $scope.colspan + 1;
                }
            },function(error){
                handleMessages(error.data,error.status);
                $location.path('/reports');
            }
        );
    };

    $scope.getColumnDate = function(column_name) {
        if (column_name == 'date_of_referral'
            || column_name == 'date_received'
            || column_name == 'appt_date'
            || column_name == 'date_moved'
            || column_name == 'first_seen'
        ) {
            return true;
        }
        return false;
    };

    $scope.getColumnDOB = function(column_name) {
        if (column_name == 'dob') {
            return true;
        }
        return false;
    };

    $scope.getColumnString = function(column_name) {
        if (column_name != 'date_of_referral'
            && column_name != 'date_received'
            && column_name != 'dob'
            && column_name != 'appt_date'
            && column_name != 'date_moved'
            && column_name != 'first_seen'
            && column_name != 'patient_treating'
            && column_name != 'is_doctor_mpn'
        ) {
            return true;
        }
        return false;
    };

    $scope.getColumnBool = function(column_name) {
        if (column_name == 'patient_treating'
            || column_name == 'is_doctor_mpn'
        ) {
            return true;
        }
        return false;
    }

    $scope.setOrder = function(sortby) {
        $scope.params.sortBy = sortby;
        if ($scope.params.sortOrder == 'desc') {
            $scope.params.sortOrder = 'asc';
        } else {
            $scope.params.sortOrder = 'desc';
        }
        $scope.getAll('reports/display/' + $scope.report_id);
    };

    $scope.isNewRecord = function(item,index){
        var created_date = moment(item.created_at).format('YYYY-MM-DD');
        var updated_date = moment(item.updated_at).format('YYYY-MM-DD');
        var today = moment().startOf('day').format('YYYY-MM-DD');
        if (item.confirmed !== null && index == 0) {
            return "td-success";
        }
        if (item.cancelled !== null && index == 0) {
            return "td-danger";
        }
        if ((item.created_at === item.updated_at) && created_date == today && index == 0) {
            return "td-info";
        }
        if ((item.created_at != item.updated_at) && updated_date == today && index == 0) {
            return "td-warning";
        }
        return "";
    };

    $scope.getExcel = function() {
        var i_frame = jQuery('#exportframe');
        i_frame.prop('src','/api/v1/reports/export/' + $scope.report_id + '?access_token=' + $cookies.get('access_token'));
    };

    $scope.search = function(){

        var _isdate = new RegExp("^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$");

        if ($scope.q.length > 3){
            if ($scope.search_field == 'dob') {
                if (_isdate.test($scope.q) === false) {
                    jQuery.noty.closeAll();
                    _noty = noty({text: 'Not a valid date. Please type the date this way: m/d/y', type: 'error', timeout: 8000});
                    return false;
                }
            }
            if ($scope.search_field == 'id') {
                if (isNaN($scope.q)) {
                    jQuery.noty.closeAll();
                    _noty = noty({text: 'Not a valid Record ID. Please type a number.', type: 'error', timeout: 8000});
                    return false;
                } else {
                    $scope.q = parseInt($scope.q);
                }
            }
            if ($scope.search_field == 'dob') {
                var _thedate = $scope.q.split('/');
                // validate month and day
                var _month = parseInt(_thedate[0]);
                var _day = parseInt(_thedate[1]);
                if (_month > 12 || _day > 31 || (_month == 2 && _day > 28)) {
                    jQuery.noty.closeAll();
                    _noty = noty({text: 'Not a valid date. Please type the date this way: m/d/y', type: 'error', timeout: 8000});
                    return false;
                }
                $scope.params.q = _thedate[2] + '-' + _thedate[0] + '-' + _thedate[1];
            } else {
                $scope.params.q = $scope.q;
            }
            $scope.params.search_field = $scope.search_field;
            $scope.getAll('reports/display/' + $scope.report_id);
        }
        if ($scope.q.length == 0){
            $scope.params.search_field = null;
            $scope.params.q = '';
            //$scope.getAll('reports/default');
            $scope.getAll('reports/display/' + $scope.report_id);
        }
    };

    $scope.printReport = function() {
        var win = window.open('/api/v1/reports/print/' + $scope.report_id + '?access_token=' + $cookies.get('access_token'));
    }

    $scope.getReports();
    $scope.getAll('reports/display/' + $scope.report_id);
});