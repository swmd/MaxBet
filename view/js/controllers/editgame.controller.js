// EDIT GAME CONTROLLER
app.controller('editGameController',function($scope,$mdDialog,$http,$mdpDatePicker,$routeParams,meanData) {

  // get logged in user details
  var vm = this;
  vm.user = {};

  $scope.total_options = ['Over', 'Under'];

  meanData.getProfile()
    .success(function(data) {
      vm.user = data;
    })
    .error(function (e) {
      console.log(e);
    });

  $scope.currentNavItem = 'editgame';
  $scope.gameData = [];
  getGameData();

  function getGameData() {
    $http.get("/games/edit/get/"+$routeParams.gameid).success(function(response){
      $scope.gameData = response.data[0];
      console.log($scope.gameData)
      $scope.gameData.dateAvailable = new Date(response.data[0].dateAvailable);
      $scope.gameData.dateClose = new Date(response.data[0].dateClose);
    });
  }

  this.showDatePicker = function(ev) {
    $mdpDatePicker($scope.currentDate, {
      targetEvent: ev
    }).then(function(selectedDate) {
      $scope.currentDate = selectedDate;
    });;
  };

  this.filterDate = function(date) {
    return moment(date).date() % 2 == 0;
  };

  this.showTimePicker = function(ev) {
    $mdpTimePicker($scope.currentTime, {
      targetEvent: ev
    }).then(function(selectedDate) {
      $scope.currentTime = selectedDate;
    });;
  }

  $scope.openLink = function () {
    if ($scope.gameData.gameLink) {
      if ($scope.gameData.title)
        window.open($scope.gameData.gameLink, '_blank');
    } else {
      console.log('No link');
    }
  };

  $scope.changeType = function(line) {
    if (line.lineType !== 'vs') {
      _.forEach(line.options, function(option) {
        option.optionSpread = 0;
      });
    }
  };

  $scope.closeGame = function(){
    $scope.gameData.dateClose = new Date();
  }

  // dynamic add field

  $scope.addRow = function(index){
      var line = {
        lineName: "",
        lineType: "",
          options: [
            {
              optionName: "",
              optionOdds: 50,
              optionSpread: 0,
              optionJuice: 0,
              variableJuice: true
            },
            {
              optionName: "",
              optionOdds: 50,
              optionSpread: 0,
              optionJuice: 0,
              variableJuice: true
            }
          ]
      };
      if($scope.gameData.lines.length <= index+1){
           $scope.gameData.lines.splice(index+1,0,line);
       }
    };

  $scope.deleteRow = function($event,index){
    if($event.which == 1)
       $scope.gameData.lines.splice(index,1);
    }

  $scope.addNewOption = function(index) {
    var data = {
      optionName : "",
      optionOdds: 0,
      optionSpread: 0,
      optionJuice: 0,
      variableJuice: true
    };
    $scope.gameData.lines[index].options.push(data);
    for (var o = 0; o < $scope.gameData.lines[index].options.length; o++) {
      var odds = 100 / $scope.gameData.lines[index].options.length;
      $scope.gameData.lines[index].options[o].optionOdds = odds;
    }
  }

  $scope.toggleVariableJuice = function(optionHashKey, lineHashKey) {
    angular.forEach($scope.gameData.lines, function(lines, lineIndex){
      // 1. compare the target object's hashKey to the current member of the iterable:
      if (lines.$$hashKey === lineHashKey) {
        // remove the matching item from the array
        angular.forEach($scope.gameData.lines[lineIndex].options, function(options, optionIndex){
          if (options.$$hashKey === optionHashKey) {
            // console.log($scope.newGameFormData.lines[lineIndex].options[optionIndex].variableJuice);
            var variableJuice = $scope.gameData.lines[lineIndex].options[optionIndex].variableJuice;
            if (variableJuice) { $scope.gameData.lines[lineIndex].options[optionIndex].variableJuice = false; }
            if (!variableJuice) { $scope.gameData.lines[lineIndex].options[optionIndex].variableJuice = true; }
            // and exit the loop right away
            return;
          }
        });
        // and exit the loop right away
        return;
      };
    });
  }

  $scope.removeOption = function(optionHashKey, lineHashKey) {
    angular.forEach($scope.gameData.lines, function(lines, lineIndex){
      // 1. compare the target object's hashKey to the current member of the iterable:
      if (lines.$$hashKey === lineHashKey) {
        // remove the matching item from the array
        angular.forEach($scope.gameData.lines[lineIndex].options, function(options, optionIndex){
          if (options.$$hashKey === optionHashKey) {
            $scope.gameData.lines[lineIndex].options.splice(optionIndex, 1);
            // and exit the loop right away
            return;
          }
        });
        // and exit the loop right away
        return;
      };
    });
  }

  $scope.updateGame = function(ev) {
    console.log($scope.gameData)
    for (i = 0; i < $scope.gameData.lines.length; i++) {
      $scope.gameData.lines[i].lineIndex = i;
    }
    var message = {"title" : "", "message" : ""};
    $http.put("/games",$scope.gameData).success(function(response) {
      if(response.responseCode === 0) {
        message.title = "Success";
        message.message = "Game successfully updated";
      } else {
        message.title = "Error";
        message.message = "Can't update the game";
      }
      $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.querySelector('#popupContainer')))
          .clickOutsideToClose(true)
          .title(message.title)
          .textContent(message.message)
          .ok('Got it!')
          .targetEvent(ev)
      );
    });
  }

});