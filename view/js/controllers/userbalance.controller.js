// USER BALANCES CONTROLLER
app.controller('userBalanceController',function($scope,$http,$location,meanData,$window,$route,authentication,$mdToast) {

  var vm = this;
  vm.user = {};
  $scope.oldPassword = "";
  $scope.newPassword = "";
  $scope.newPassword2 = "";
  $scope.balanceData = [];
  $scope.gamesByTitle = [];
  $scope.gamesByDate = [];
  $scope.isMoreClosedBetsAvailable = true;
  
  $scope.getBalanceData = function() {
    $http.get("/games/bethistory/" + vm.user.email + '/skip/' + $scope.gamesByDate.length).success(function(response){
      $scope.balanceData = response.data;
      $scope.gamesByTitle = _.groupBy($scope.balanceData, 'gameTitle');
      addInfoToGames($scope.gamesByTitle)
      var gameCount = sortByDate($scope.gamesByTitle)
      console.log("gamesByTitle")
      console.log($scope.gamesByTitle);
      // $scope.gamesByDate = _.orderBy($scope.gamesByDate, ['date'], ['desc']);
      console.log("gamesByDate")
      console.log($scope.gamesByDate);
      if (gameCount < 10) {
        $scope.isMoreClosedBetsAvailable = false;
      }
    });
  };

  meanData.getProfile()
    .success(function(data) {
      vm.user = data;
      $scope.getBalanceData();
    })
    .error(function (e) {
      console.log(e);
    });

  $scope.checkPassword = function() {
    vm.credentials = {
      email : vm.user.email,
      password : $scope.oldPassword,
      keepLoggedIn : true,
    }
    authentication
      .checkPw(vm.credentials)
      .error(function(err){
        // alert(err);
        $scope.showSimpleToast(err)
      })
      .then(function(data){
        console.log("Creds OK, gonna change PW :)")
        var user = {
          email: vm.user.email,
          password: $scope.newPassword
        }
        $http.put("/users/sitepoint/changepw",user).success(function(response) {
          if(response.responseCode === 0) {
            // alert("Update successful");
            $scope.showSimpleToast("Password changed")
          } else {
            // alert("Can't update settings");
            $scope.showSimpleToast("Error changing password")
          }
        });
      });
  }

  $scope.saveSettings = function() {
    var data = {
      "email" : vm.user.email,
      "settings" : vm.user.settings
    };
    $http.put("/users/sitepoint",data).success(function(response) {
      if(response.responseCode === 0) {
        // alert("Update successful");
        $scope.showSimpleToast("Settings saved")
      } else {
        // alert("Can't update settings");
        $scope.showSimpleToast("Error saving settings")
      }
    });
  }

  function addInfoToGames(games) {
    _.forEach(games, function(value, key) {
      var gameValue = {
        gameTitle: key,
        bets: value,
        date: value[0].date
      };
      $http.get("/games/gamehistory/"+value[0].gameId).success(function(response) {
        if(response.responseCode === 0) {
          console.log('fetch game data for "' + key + '": ', response.data);
          if(response.data) {
            if (response.data.length == 0) return;
            gameValue.gameData = response.data[0];
            if (!gameValue.gameData.lines) return;
            // get option points from game data and put into bet data
            _.forEach(gameValue.bets, function(bet) {              
              if (!gameValue.gameData.lines[bet.lineIndex]) return;
              var options = gameValue.gameData.lines[bet.lineIndex].options;
              if (bet.lineType === 'vs') {
                if (bet.optionName === options[0].optionName) {
                  bet.scoreLine = options[0].points + ' to ' + options[1].points;
                  bet.scoreDifference = Math.abs(options[0].points + options[0].optionSpread - options[1].points);
                } else {
                  bet.scoreLine = options[1].points + ' to ' + options[0].points;
                  bet.scoreDifference = Math.abs(options[1].points + options[1].optionSpread - options[0].points);
                }
              } else if (bet.lineType === 'total') {
                if (bet.optionName === options[0].optionName) {
                  bet.scoreLine = options[0].points;
                  bet.scoreDifference = Math.abs(options[0].points - options[0].optionSpread);
                } else {
                  bet.scoreLine = options[1].points;
                  bet.scoreDifference = Math.abs(options[1].points - options[1].optionSpread);
                }
              } else if (bet.lineType === 'future') {

              }
              bet.scoreDifference = Number(bet.scoreDifference.toFixed(2));
            });
          }
        } else {
          console.log('error fetching game data for "' + key + '"');
        }
      });
      var winCount = 0, loseCount = 0, tieCount = 0, result = 0;
      _.forEach(value, function(bet) {
        if (bet.status == 'Winner') {
          winCount ++;
        } if (bet.status == 'Loser') {
          loseCount ++;
        } else if (bet.status == 'Tie') {
          tieCount ++;
        }
        result += bet.result;
      });
      gameValue.winCount = winCount;
      gameValue.loseCount = loseCount;
      gameValue.tieCount = tieCount;
      gameValue.result = result;
      games[key] = gameValue;
    });
  }

  function sortByDate(games) {
    var count = 0;
    _.forEach(games, function(value, key) {
      count ++;
      $scope.gamesByDate.push(value);
    });
    return count;
  }

  $scope.accordionInit = function () {
      $('.ui.accordion').accordion();
  };

  $scope.reload = function () {
      $window.location.reload();
  };

  $scope.logout = function() {
    $window.localStorage.removeItem('mean-token');
    $location.path("/profile")
  };

  var last = {
      bottom: false,
      top: true,
      left: false,
      right: true
    };

  $scope.toastPosition = angular.extend({},last);

  $scope.getToastPosition = function() {
    sanitizePosition();

    return Object.keys($scope.toastPosition)
      .filter(function(pos) { return $scope.toastPosition[pos]; })
      .join(' ');
  };

  function sanitizePosition() {
    var current = $scope.toastPosition;

    if ( current.bottom && last.top ) current.top = false;
    if ( current.top && last.bottom ) current.bottom = false;
    if ( current.right && last.left ) current.left = false;
    if ( current.left && last.right ) current.right = false;

    last = angular.extend({},current);
  }

  $scope.showSimpleToast = function(info) {
    var pinTo = $scope.getToastPosition();
    console.log(pinTo)


    $mdToast.show(
      $mdToast.simple()
        .textContent(info)
        .position(pinTo)
        .hideDelay(3000)
    );
  };

  $scope.closeToast = function() {
    $mdToast.hide();
  };

});
