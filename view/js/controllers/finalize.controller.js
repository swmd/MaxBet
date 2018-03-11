// FINALIZE GAMES CONTROLLER
app.controller('finalizeGameController',function($scope,$http,$location,$mdDialog,$routeParams,meanData,$window) {


  $scope.Math = window.Math;
  // get logged in user details
  var vm = this;
  vm.user = {};
  $scope.inProgress = false;

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
      console.log('game data: ', $scope.gameData);
    });
  }

  $scope.juiceChart = {};
  getJuiceChart();
  function getJuiceChart() {
    $http.get("/admin/vabe").success(function(response){
      $scope.juiceChart = response.data[0].defaultjuice;
    });
  }

  // display total of player scores for VS type lines
  $scope.getTotal = function(line){
      var total = 0;
      for(var i = 0; i < line.options.length; i++){
          var score = line.options[i].points;
          total += (score);
      }
      return total;
  }

  // determine winner for each line after user inputs points
  $scope.createResult = function(points, option, line) {
    if (line.lineType === 'vs') {
      if (line.options[0].points && line.options[1].points) {
        if (line.options[0].points + line.options[0].optionSpread > line.options[1].points) {
          line.winnerOption = line.options[0].optionName;
        }
        if (line.options[1].points + line.options[1].optionSpread > line.options[0].points) {
          line.winnerOption = line.options[1].optionName;
        }
        if ((line.options[0].points + line.options[0].optionSpread === line.options[1].points) &&
          (line.options[1].points + line.options[1].optionSpread === line.options[0].points)) {
          line.winnerOption = 'Tie';
        }
      }
    }
    
    // option.resultPoints = points + (option.optionSpread / 2);

    // var maxObj = _.maxBy(line.options, function (obj) {
    //   return obj.resultPoints;
    // });
    // var maxIndex = line.options.indexOf(maxObj);

    // if( _.filter(line.options, ['resultPoints', maxObj.resultPoints]).length > 1 ) {
    //   line.winnerOption = "Tie";
    // } else {
    //   line.winnerOption = line.options[maxIndex].optionName;
    // }

    var total = 0;
    for(var i = 0; i < line.options.length; i++){
        var score = line.options[i].points;
        total += (score);
    }
    line.total = total;
  };

  // GET BETS FROM DB THEN DETERMINE IF WIN OR LOSE
  $scope.closedBets = [];
  $scope.betsForThisGame = [];
  $scope.finalizeScores = function finalizeScores(ev) {
    if ($scope.inProgress) {
      console.log('finalizing is in progress. please try a little later');
      return;
    }
    $scope.inProgress = true;
    $scope.gameData.date = new Date();
    $http.get("/games/bets/game/"+$routeParams.gameid).success(function(response){
      $scope.betsForThisGame = response.data;
      console.log("finalize!!!!");
      console.log($scope.betsForThisGame);

      // eloszor arrayt csinalok egyedi userekkel

      // CALCULATE RESULT OF BETS AND JUICE
      var betsByUsers = _.groupBy($scope.betsForThisGame, 'userId');
      // console.log(betsByUsers);

      var uniqueUsers = _.uniqBy($scope.betsForThisGame, 'userId');
      for (var i = 0; i < uniqueUsers.length; i++) {
        var user = uniqueUsers[i].userId;
        var thisUsersBetsByOptions = _.groupBy(betsByUsers[user], 'optionName');
        var thisUsersUniqueBets = _.size(thisUsersBetsByOptions);
        // console.log(user+"'s UniqueBets:"+thisUsersUniqueBets);
        var baseJuice = -130;

        // megadni a basejuice-t
        if( thisUsersUniqueBets < 3 ) { baseJuice = $scope.juiceChart.onetwo }
        if( thisUsersUniqueBets < 5 && thisUsersUniqueBets > 2 ) { baseJuice = $scope.juiceChart.threefour }
        if( thisUsersUniqueBets < 10 && thisUsersUniqueBets > 4 ) { baseJuice = $scope.juiceChart.fivenine }
        if( thisUsersUniqueBets > 9 ) { baseJuice = $scope.juiceChart.all }

        _.forEach(thisUsersBetsByOptions, function(value, key) {
          for (var i = 0; i < value.length; i++) {
            // console.log(value[i])
            var bet = value[i];
            bet.adjustment = bet.betAmount / 100;
            bet.adjustedBaseOdds = bet.odds + bet.adjustment;
            bet.translatesTo = -baseJuice / (100 - baseJuice);
            bet.aboveFifty = bet.translatesTo - 0.5;
            bet.thisOption = bet.odds / 100 + bet.aboveFifty;
            if (bet.thisOption > 0.5) {
              bet.toRisk = Math.round( (100 * bet.thisOption) / (bet.thisOption - 1) * (bet.betAmount / 100) );
            } else {
              bet.toRisk = Math.round( 100 * (1 - bet.thisOption) / (bet.thisOption) * (bet.betAmount / 100) );
            }

            // evaluate line winner option
            for (var bi = 0; bi < $scope.gameData.lines.length; bi++) {
              var line = $scope.gameData.lines[bi];
              line.result = 0;

              if(line.lineName === bet.lineName) {
                if (line.lineType === 'vs') {
                  var currentOption, otherOption;
                  if (line.options[0].optionName === bet.optionName) {
                    currentOption = line.options[0];
                    otherOption = line.options[1];
                  } else {
                    currentOption = line.options[1];
                    otherOption = line.options[0];
                  }
                  // evaluate game status
                  if (currentOption.points + currentOption.optionSpread === otherOption.points) {
                    bet.status = 'Tie';
                  } else {
                    if (currentOption.points + currentOption.optionSpread > otherOption.points) {
                      bet.status = 'Winner';
                    } else {
                      bet.status = 'Loser';
                    }
                  }
                } else if (line.lineType === 'total') {
                  if (line.options[0].optionName === bet.optionName) {
                    if (line.options[0].points > line.options[0].optionSpread) {    // optionSpread is total score criterion
                      bet.status = 'Winner';
                    } else if (line.options[0].points < line.options[0].optionSpread) {
                      bet.status = 'Loser';
                    } else {
                      bet.status = 'Tie';
                    }
                  } else if (line.options[1].optionName === bet.optionName) {
                    if (line.options[1].points < line.options[1].optionSpread) {
                      bet.status = 'Winner';
                    } else if (line.options[1].points > line.options[1].optionSpread) {
                      bet.status = 'Loser';
                    } else {
                      bet.status = 'Tie';
                    }
                  }
                } else if (line.lineType === 'future') {
                  for (var oi = 0; oi < line.options.length; oi ++) {
                    if (line.options[oi].optionName === bet.optionName) {
                      if (line.options[oi].points === 1) {
                        bet.status = 'Winner';
                      } else {
                        bet.status = 'Loser';
                      }
                    }
                  }
                }
              }
            }

            $scope.closedBets.push(bet);
          }
        });
      }
      
      // adjust user balances
      // loop a final arrayen, ha nyer balance plusz, ha veszt akkor minusz
      for (var bi = 0; bi < $scope.gameData.lines.length; bi++) {
        var line = $scope.gameData.lines[bi];
        line.result = 0;
        line.bets = [];
        for (var i = 0; i < $scope.closedBets.length; i++) {
          var bet = $scope.closedBets[i];
          var adjustment = 0;
          // IF BET ALREADY FINALIZED SAVE THE PREV RESULT BEFORE OVERWRITING WITH NEW VALUE
          if(bet.finalized === true) { bet.prevResult = bet.balanceAdjustment; }
          if(line.lineName === bet.lineName) {
            if (bet.status == 'Tie') {
              bet.balanceAdjustment = 0;
            } else if (bet.status == 'Winner') {
              bet.balanceAdjustment = bet.betAmount;
            } else if (bet.status == 'Loser') {
              if ( bet.toRisk > 0 ) { bet.balanceAdjustment = Math.abs(Math.round(bet.betAmount / (bet.toRisk / bet.betAmount * 100)*100)) * -1 }
              // ha negativ
              else { bet.balanceAdjustment = bet.toRisk }
            }
            line.result += bet.balanceAdjustment;
            line.bets.push({
              userId: bet.userId,
              result: bet.balanceAdjustment,
              status: bet.status,
              odds: bet.odds,
              optionName: bet.optionName,
              betAmount: bet.betAmount
            });
          }
        }
      }

      $scope.updateGame($scope.gameData, ev);

      console.log("final");
      var finalByUsers = _.groupBy($scope.closedBets, 'userId');
      console.log(finalByUsers);

      var betCount = Object.keys($scope.closedBets).length;                 // count for detecting end of async processes
      var processCount = 0;
      // az finalByUsers-ben user szerint van rendezve az osszes bet, ez alapjan megvan
      // hogy mennyivel valtozik a balance es DB-ben atirom ez alapjan
      var adminBalanceAdjustment = 0;
      _.forEach(finalByUsers, function(value, key) {
        var adjustBy = _.sumBy(finalByUsers[key], 'balanceAdjustment');
        var prevAdjustBy = _.sumBy(finalByUsers[key], 'prevResult');
        if(prevAdjustBy === undefined) { prevAdjustBy = 0; }
        adminBalanceAdjustment = adminBalanceAdjustment + adjustBy - prevAdjustBy;
        $http.get("users/sitepoint/"+key).success(function(userresponse){
          var user = userresponse.data[0];
          // console.log("adjusting "+key+" balance "+user.balance+" to "+(user.balance+adjustBy)+" by "+adjustBy);
          user.balance = user.balance + adjustBy - prevAdjustBy;
          user.totalbets += value.length;
          var wins = 0, loses = 0;
          
          // set balance before and after on bet for balance history
          var currBalance = user.balance - adjustBy;
          for (var i = 0; i < value.length; i++) {
            var bet = value[i];
            bet.balanceHistoryID = i;
            bet.balanceBefore = currBalance;
            bet.balanceAfter = currBalance + bet.balanceAdjustment;
            currBalance = currBalance + bet.balanceAdjustment;
            
            if (bet.status == 'Winner') {
              wins ++;
            } else if (bet.status == 'Loser') {
              loses ++;
            }
            
            if(bet.finalized === true) {
              bet.result = bet.balanceAdjustment;
              bet.balance = bet.balanceAfter;
              $http.put('/games/bethistory',bet).success(function(response) {
                if(response.responseCode === 0) {
                  // console.log("history bet sent successfuly")
                } else {
                  // alert("Error sending history bet")
                }
              });
            } else {
              bet.finalized = true;
              $http.post('/games/bethistory',bet).success(function(response) {
                if(response.responseCode === 0) {
                  // console.log("history bet sent successfuly")
                } else {
                  // alert("Error sending history bet")
                }
              });
            }
            var deleteId = bet.id;

            bet.finalized = true;
            $http.put('/games/bets',bet).success(function(response) {
              if(response.responseCode === 0) {
                // console.log("bet successfuly deleted from bets")
              } else {
                console.log("can't delete from bets")
                // console.log(response)
              }
              processCount ++;
              if (processCount == betCount) {
                console.log('all processes are completed');
                $scope.inProgress = false;
              }
            });
          }

          user.wins += wins;
          user.loses += loses;
          $http.put("/users/sitepoint", user).success(function(response) {
            if(response.responseCode === 0) {
              //alert("User balance update successful");
            } else {
              // console.log(response)
            }
          });
        })
      });

      $http.delete('/games/openbets/delete/game/'+$routeParams.gameid).success(function(response) {
        if(response.responseCode === 0) {
          console.log("bet successfuly deleted from openbets")
        } else {
          // console.log("can't delete from openbets")
          // console.log(response)
        }        
      });
      // console.log("admin balanace adjustment");
      // console.log(adminBalanceAdjustment);
      // adjust admin balance
      $http.get("users/sitepoint/admin").success(function(adminresponse){
        var admin = adminresponse.data[0];
        admin.balance = admin.balance + adminBalanceAdjustment;
        $http.put("/users/sitepoint",admin).success(function(response) {
          if(response.responseCode === 0) {
            //alert("Admin balance update successful");
          } else {
            alert("Admin balance update error");
            // console.log(response)
          }
        });
      });

      console.log(finalByUsers);
      $scope.finishGame($scope.gameData, ev)
    });
  }

  $scope.sendClosedBets = function(closedBets) {
    for (var i = 0; i < closedBets.length; i++) {
      var bet = closedBets[i];
      if(bet.finalized === true) {
        $http.put('/games/closedbets',bet).success(function(response) {
          if(response.responseCode === 0) {
            console.log("bet sent successfuly")
            // $scope.gameData.push(data);
          } else {
            alert("Error sending bet")
          }
        });
      } else {
        bet.finalized = true;
        $http.post('/games/closedbets',bet).success(function(response) {
          if(response.responseCode === 0) {
            console.log("bet sent successfuly")
            // $scope.gameData.push(data);
          } else {
            alert("Error sending bet")
          }
        });
      }
    }
  }

  $scope.updateGame = function(game, ev) {
    var message = {"title" : "", "message" : ""};
    $http.put("/games",game).success(function(response) {
      if(response.responseCode === 0) {
        message.title = "Success";
        message.message = "Game successfully finalized";
      } else {
        message.title = "Error";
        message.message = "Can't finalize game";
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
  };

  $scope.finishGame = function(game, ev) {
    if (game.finalized) {
      $http.put('/games/gamehistory', game).success(function(response) {
        if(response.responseCode === 0) {
          console.log("game sent successfuly");
        } else {
          alert("Error editing game");
          console.log('game history error: ', response);
        }
      });
    } else {
      game.finalized = true;
      $http.post('/games/gamehistory', game).success(function(response) {
        if(response.responseCode === 0) {
          console.log("game sent successfuly");
        } else {
          alert("Error finalizing game");
          console.log('game history error: ', response);
        }
      });
    }
  }

});