// GAMES CONTROLLER
app.controller('gamesController',function($scope,$mdDialog,$http,$mdpDatePicker,socket,meanData) {

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

  $scope.currentNavItem = 'newgame';
  $scope.gameData = [];
  $scope.voteData = {};
  $scope.hiddenrows = [];
  getGameData();
  function getGameData() {
    $http.get("/games").success(function(response){
      $scope.gameData = response.data;
    });
  }

  $scope.newGameFormData = {
    lines:[
        {
          // lineIndex: 0,
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
        }
      ]
  };

  $scope.openLink = function () {
    if ($scope.newGameFormData.gameLink) {
      if ($scope.newGameFormData.gameTitle)
        window.open($scope.newGameFormData.gameLink, '_blank');
    } else {
      console.log('No link');
    }
  };

  $scope.newGameFormData.dateClose = new Date();
  $scope.newGameFormData.dateAvailable = new Date();

  $scope.parselines = function(json){
    var lines = JSON.parse(json)
    $scope.newGameFormData.lines = lines;
  }

  $scope.showPrerenderedDialog = function(ev) {
    $mdDialog.show({
      controller: DialogController,
      contentElement: '#myDialog',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true
    });
  };

  function DialogController($scope, $mdDialog) {
    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.answer = function(answer) {
      $mdDialog.hide(answer);
    };
  }

  $scope.changeType = function(line) {
    if (line.lineType === 'future') {
      _.forEach(line.options, function(option) {
        option.optionSpread = 0;
      });
    }
    if (line.lineType !== 'total') {
      line.options = line.options.slice(0, 3);
    }
  };

  // dynamic add field

  $scope.addRow = function(index){
      var line = {
        // lineIndex: index,
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
      if($scope.newGameFormData.lines.length <= index+1) {
          $scope.newGameFormData.lines.splice(index+1,0,line);
      }
    };

  // $scope.addLineIndex = function(index, line){
  //     line.lineIndex = index;
  // }

  $scope.deleteRow = function($event,index){
    if($event.which == 1)
       $scope.newGameFormData.lines.splice(index,1);
  }

  $scope.addNewOption = function(index) {
    var data = {
      optionName : "",
      optionOdds: 0,
      optionSpread: 0,
      optionJuice: 0,
      variableJuice: true
    };
    $scope.newGameFormData.lines[index].options.push(data);
    for (var o = 0; o < $scope.newGameFormData.lines[index].options.length; o++) {
      var odds = 100 / $scope.newGameFormData.lines[index].options.length;
      $scope.newGameFormData.lines[index].options[o].optionOdds = odds;
    }
  }

  $scope.toggleVariableJuice = function(optionHashKey, lineHashKey) {
    angular.forEach($scope.newGameFormData.lines, function(lines, lineIndex){
      // 1. compare the target object's hashKey to the current member of the iterable:
      if (lines.$$hashKey === lineHashKey) {
        // remove the matching item from the array
        angular.forEach($scope.newGameFormData.lines[lineIndex].options, function(options, optionIndex){
          if (options.$$hashKey === optionHashKey) {
            // console.log($scope.newGameFormData.lines[lineIndex].options[optionIndex].variableJuice);
            var variableJuice = $scope.newGameFormData.lines[lineIndex].options[optionIndex].variableJuice;
            if (variableJuice) { $scope.newGameFormData.lines[lineIndex].options[optionIndex].variableJuice = false; }
            if (!variableJuice) { $scope.newGameFormData.lines[lineIndex].options[optionIndex].variableJuice = true; }
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
    angular.forEach($scope.newGameFormData.lines, function(lines, lineIndex){
      // 1. compare the target object's hashKey to the current member of the iterable:
      if (lines.$$hashKey === lineHashKey) {
        // remove the matching item from the array
        angular.forEach($scope.newGameFormData.lines[lineIndex].options, function(options, optionIndex){
          if (options.$$hashKey === optionHashKey) {
            $scope.newGameFormData.lines[lineIndex].options.splice(optionIndex, 1);
            // and exit the loop right away
            return;
          }
        });
        // and exit the loop right away
        return;
      };
    });
  }

  $scope.submitNewGame = function(ev) {
    var data = {
      "title" : $scope.newGameFormData.gameTitle,
      "gameLink" : $scope.newGameFormData.gameLink,
      "maxBet" : $scope.newGameFormData.gameMaxBet,
      "dateAvailable": $scope.newGameFormData.dateAvailable,
      "dateClose": $scope.newGameFormData.dateClose,
      "finalized": false,
      "lines" : $scope.newGameFormData.lines
    };
    for (i = 0; i < data.lines.length; i++) {
      data.lines[i].lineIndex = i;
    }
    var message = {"title" : "", "message" : ""};
    $http.post('/games',data).success(function(response) {
      if(response.responseCode === 0) {
        message.title = "Success";
        message.message = "Game successfully created";
        $scope.gameData.push(data);
      } else {
        message.title = "Error";
        message.message = "Can't add new game";
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

  $scope.accordionInit = function () {
      $('.ui.accordion').accordion();
  };

  // ADD GAME TO PAGE
  socket.on('gameAdded',function(data) {
    $scope.gameData.push(data.doc);
    $scope.$apply();
  });

  // UPDATE GAME ON PAGE
  socket.on('gameUpdated',function(data) {
    for(var i = 0; i < $scope.gameData.length; i++) {
        if($scope.gameData[i].id === data.doc.id) {
            $scope.gameData[i] = data.doc;
            $scope.$apply();
            break;
        }
    }
  });

  // DELETE GAME ON PAGE
  socket.on('gameDeleted',function(data) {
    for(var i = 0; i < $scope.gameData.length; i++) {
        if($scope.gameData[i].id === data.doc.id) {
            $scope.gameData.splice(i, 1);
            $scope.$apply();
            break;
        }
    }
  });


  // UPDATE BETS
  socket.on('changeBetsFeed',function(data) {
    // for(var gameCounter = 0; gameCounter < $scope.gameData.length; gameCounter++) {
    //   if($scope.gameData[gameCounter].id === data.id) {
    //     $scope.gameData[gameCounter].games = data.games;
    //     $scope.$apply();
    //   }
    // }
    // console.log("new bet on " + data.title);
    // console.log("juiceBefore: " + data.juiceBefore);
    // console.log("juiceAfter: " + data.juiceAfter);
    // console.log("oddsBefore: " + data.oddsBefore);
    // console.log("oddsAfter: " + data.oddsAfter);
    // console.log(data);
  });

});