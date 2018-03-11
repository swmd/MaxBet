// ORIGINAL POLL

var app = angular.module('starterApp', ['ngMaterial', 'ngRoute', 'ngMessages', 'mdPickers', 'countdownTimer', 'ngSanitize']);

app.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'home.html',
            controller: 'pollingController'
        })
        .when('/create/poll', {
            templateUrl: 'createPoll.html',
            controller: 'pollingController'
        })
        .when('/view/polls', {
            templateUrl: 'viewPolls.html',
            controller: 'pollingController'
        })
        .when('/create/game', {
            templateUrl: 'createGame.html',
            controller: 'gamesController',
            controllerAs: 'vm'
        })
        .when('/view/games', {
            templateUrl: 'viewGames.html',
            controller: 'viewGamesController',
            controllerAs: 'vm'
        })
        .when('/edit/game/:gameid', {
            templateUrl: 'editGame.html',
            controller: 'editGameController',
            controllerAs: 'vm'
        })
        .when('/finalize/game/:gameid', {
            templateUrl: 'finalizeGame.html',
            controller: 'finalizeGameController',
            controllerAs: 'vm'
        })
        .when('/admin/settings', {
            templateUrl: 'adminSettings.html',
            controller: 'adminController',
            controllerAs: 'vm'
        })
        .when('/admin/dashboard', {
            templateUrl: 'adminDashboard.html',
            controller: 'adminDashboardController',
            controllerAs: 'vm'
        })
        .when('/userbalance', {
            templateUrl: 'userBalance.html',
            controller: 'userBalanceController',
            controllerAs: 'vm'
        })
        // SITEPOINT
        .when('/sitepointhome', {
            templateUrl: 'home/home.view.html',
            controller: 'homeCtrl',
            controllerAs: 'vm'
        })
        .when('/register', {
            templateUrl: 'auth/register/register.view.html2',
            controller: 'registerCtrl',
            controllerAs: 'vm'
        })
        .when('/login', {
            templateUrl: 'auth/login/login.view.html',
            controller: 'loginCtrl',
            controllerAs: 'vm'
        })
        .when('/', {
            templateUrl: 'profile/profile.view.html',
            controller: 'profileCtrl',
            controllerAs: 'vm'
        })
        .otherwise({ redirectTo: '/' });

    // use the HTML5 History API
    // $locationProvider.html5Mode(true);
});

app.run(function($rootScope, $location, authentication, meanData) {
    $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute) {
        if ($location.path() === '/' && !authentication.isLoggedIn()) {
            $location.path('/login');
        }
        if ($location.path() !== '/' && $location.path() !== '/userbalance' && $location.path() !== '/login' && $location.path() !== '/register') {
            var user = {};
            meanData.getProfile()
                .success(function(data) {
                    user = data;
                    if (user.email !== "admin") { $location.path('/'); }
                    console.log(user)
                })
                .error(function(e) {
                    console.log(e);
                    $location.path('/login');
                });
        }
    });
})

app.controller('homeCtrl', function($scope) {
    console.log('Home controller is running');
});

app.controller('registerCtrl', function($scope, $http, $location, authentication, meanData) {
    var vm = this;

    vm.credentials = {
        name: "",
        email: "",
        password: "",
        balance: "",
        settings: {
            betConfirm: true,
            betSharing: true
        }
    };

    vm.onSubmit = function() {
        console.log('Submitting registration');
        authentication
            .register(vm.credentials)
            .error(function(err) {
                alert(err);
            })
            .then(function() {
                $location.path('profile');
            });
    };
});

app.controller('loginCtrl', function($scope, $location, authentication, $rootScope) {
    var vm = this;

    vm.credentials = {
        email: "",
        password: "",
        keepLoggedIn: true,
    };

    vm.onSubmit = function() {
        authentication
            .login(vm.credentials)
            .error(function(err) {
                alert(err);
            })
            .then(function() {
                $location.path('profile');
            });
    };
});

app.service('authentication', function($http, $window) {
    var saveToken = function(token) {
        $window.localStorage['mean-token'] = token;
    };

    var getToken = function() {
        return $window.localStorage['mean-token'];
    };

    var isLoggedIn = function() {
        var token = getToken();
        var payload;

        if (token) {
            payload = token.split('.')[1];
            payload = $window.atob(payload);
            payload = JSON.parse(payload);

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };

    var currentUser = function() {
        if (isLoggedIn()) {
            var token = getToken();
            var payload = token.split('.')[1];
            payload = $window.atob(payload);
            payload = JSON.parse(payload);
            return {
                email: payload.email,
                name: payload.name,
                balance: payload.balance,
                settings: payload.settings
            };
        }
    };

    register = function(user) {
        return $http.post('/api/register', user).success(function(data) {
            saveToken(data.token);
        });
    };

    login = function(userdata) {
        userdata.email = userdata.email.toLowerCase();
        return $http.post('/api/login', userdata).success(function(data) {
            saveToken(data.token);
        });
    };

    checkPw = function(userdata) {
        userdata.email = userdata.email.toLowerCase();
        return $http.post('/api/login', userdata).success(function(data) {});
    };

    logout = function() {
        $window.localStorage.removeItem('mean-token');
    };

    return {
        currentUser: currentUser,
        saveToken: saveToken,
        getToken: getToken,
        isLoggedIn: isLoggedIn,
        register: register,
        login: login,
        logout: logout,
        checkPw: checkPw
    };
});

app.service('meanData', function($http, authentication) {
    var getProfile = function() {
        return $http.get('/api/profile', {
            headers: {
                Authorization: 'Bearer ' + authentication.getToken()
            }
        });
    };

    return {
        getProfile: getProfile
    };
});

// ADMIN CONTROLLER
app.controller('adminController', function($scope, $mdDialog, $http, $location, $log, socket, meanData) {

    var vm = this;
    vm.user = {};
    meanData.getProfile()
        .success(function(data) {
            vm.user = data;
        })
        .error(function(e) {
            console.log(e);
        });

    $scope.currentNavItem = 'admin';
    $scope.adminData = [];
    $scope.userformData = {};
    $scope.usersData = [];
    $scope.hiddenrows = [];
    getAdminData();
    getUsersData();

    function getAdminData() {
        $http.get("/admin/vabe").success(function(response) {
            $scope.adminData = response.data[0];
        });
    }

    function getUsersData() {
        $http.get("/users/sitepoint").success(function(response) {
            $scope.usersData = response.data;
        });
    }

    $scope.updateAdminData = function() {
        var data = {
            "id": $scope.adminData.id,
            "defaultjuice": $scope.adminData.defaultjuice,
            "juicemovement": $scope.adminData.juicemovement
        };
        $http.put("/admin", data).success(function(response) {
            if (response.responseCode === 0) {
                alert("Update successful");
            } else {
                alert("Can't update settings");
            }
        });
    }

    $scope.submitNewUser = function() {
        var data = {
            email: $scope.userformData.username.toLowerCase(),
            password: $scope.userformData.password,
            balance: $scope.userformData.balance,
            name: $scope.userformData.displayName,
            settings: {
                betConfirm: true,
                betSharing: true
            }
        };
        var message = { "title": "", "message": "" };
        $http.post('/api/register', data).success(function(response) {
            if (response.token !== "") {
                alert(data.email + " has been successfully added");
                $scope.userformData.username = "";
                $scope.userformData.password = "";
                $scope.userformData.balance = "";
                $scope.userformData.description = "";
                $scope.usersData.push(data);
                // adjust admin balance
                $http.get("users/sitepoint/admin").success(function(adminresponse) {
                    var admin = adminresponse.data[0];
                    admin.balance = admin.balance + data.balance;
                    $http.put("/users/sitepoint", admin).success(function(response) {
                        if (response.responseCode === 0) {
                            //alert("Admin balance update successful");
                        } else {
                            alert("Admin balance update error");
                            console.log(response)
                        }
                    });
                });
            } else {
                alert("Can't add new user: " + data.email);
            }
        });
    }

    $scope.updateUserData = function(index, balance, adjustment, description) {
        console.log(index, balance, adjustment, description);
        var data = {
            // "id" : userid,
            "email": $scope.usersData[index].email,
            "balance": balance + adjustment
        };
        $http.put("/users/sitepoint", data).success(function(response) {
            if (response.responseCode === 0) {
                alert("Update successful");
                // save adjustment details to user balance history
                var historybet = {
                    "userId": data.email,
                    "gameId": "",
                    "gameTitle": "Admin adjustments",
                    "lineName": new Date().toDateString(),
                    "date": new Date(),
                    "optionName": description,
                    "optionSpread": 0,
                    "betAmount": 0,
                    "odds": 0,
                    "toRisk": 0,
                    "status": adjustment > 0 ? "Winner" : "Loser",
                    "balanceAfter": balance + adjustment,
                    "balanceAdjustment": adjustment,
                    "balanceHistoryID": 0
                }
                $http.post("/games/bethistory", historybet).success(function(response) {
                    console.log("history bet successfully sent");
                });
                // adjust admin balance
                $http.get("users/sitepoint/admin").success(function(adminresponse) {
                    var admin = adminresponse.data[0];
                    admin.balance = admin.balance + adjustment;
                    $http.put("/users/sitepoint", admin).success(function(response) {
                        if (response.responseCode === 0) {
                            //alert("Admin balance update successful");
                        } else {
                            alert("Admin balance update error");
                            console.log(response)
                        }
                    });
                });
                getUsersData();
            } else {
                alert("Can't update user data");
                console.log(response)
            }
        });
    }

});

// VIEW EDIT GAMES CONTROLLER
app.controller('viewGamesController', function($scope, $http, $location, meanData, $mdDialog) {

    // get logged in user details
    var vm = this;
    vm.user = {};

    meanData.getProfile()
        .success(function(data) {
            vm.user = data;
        })
        .error(function(e) {
            console.log(e);
        });

    $scope.currentNavItem = 'editgame';
    $scope.gameData = [];
    getGameData();

    function getGameData() {
        $http.get("/games").success(function(response) {
            $scope.gameData = response.data;
            $scope.gameData = _.orderBy($scope.gameData, ['dateClose'], ['desc']);
            console.log($scope.gameData)
        });
    }

    $scope.removeGame = function(game, index) {
        console.log('remove game: ', game);
        var confirm = $mdDialog.confirm()
            .clickOutsideToClose(false)
            .title('Delete')
            .htmlContent('Are you sure you wish to delete this game?<br/>This is permanent.<br/>All bets on this game will be deleted.<br/>Balances will not be affected.')
            // .textContent('All of the banks have agreed to forgive you your debts.')
            // .ariaLabel('Lucky day')
            // .targetEvent(ev)
            .ok('Yes')
            .cancel('No');

        $mdDialog.show(confirm).then(function() {
            $http.delete('/games/' + game.id).success(function(response) {
                console.log('delete success: ', response);
                $scope.gameData.splice(index, 1);
            });
        }, function() {
            console.log('false');
        });
    };

});
