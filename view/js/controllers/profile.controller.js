app.controller('profileCtrl', function($scope, $location, meanData, $http, socket, $mdDialog, $mdToast, $timeout, $interval, $q) {

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

    // GAME TIMER SECTION - HIDE / SHOW LOGIC
    $scope.hideGame = function(game) {
        $http.get("/games/gametime").success(function(response) {
            var now = new Date(response.data);
            var localnow = new Date();
            var timeOffset = now - localnow;
            var open = new Date(game.dateAvailable);
            var close = new Date(game.dateClose);

            game.eventDay = {
                date: new Date("September 18, 2016 20:00:00"),
                eventDetails: ""
            };

            // ha meg nem open a game
            if (now < open) {
                console.log("not open yet.");
                game.show = false;
                game.status = "later";
                game.statusText = "Game will open for betting in:";
                var openIn = open - now;
                game.eventDay = {
                    date: new Date(game.dateAvailable),
                    eventDetails: "Game will open for betting in:"
                };
                $timeout(openIn).then(function() {
                    console.log("now open. will close at " + close);
                    game.status = "open";
                    game.statusText = "Lines will close in:";
                    game.show = true;
                    game.eventDay = {
                        date: new Date(game.dateClose),
                        eventDetails: "Lines will close in:"
                    };
                });
                // ha mar open de meg nem closed
            }
            if (now < close && now > open) {
                game.statusText = "Lines will close in:";
                game.status = "open";
                var closeIn = close - now;
                game.eventDay = {
                    date: new Date(game.dateClose),
                    eventDetails: "Lines will close in:"
                };
                $timeout(closeIn).then(function() {
                    console.log("game closed.");
                    game.status = "closed";
                    game.statusText = "Lines are closed";
                    // game.show = false;
                    // var ind = $scope.gameData.indexOf(game);
                    // $scope.gameData.splice(ind, 1);
                });
                // ha mar closed
            }
            if (now > close) {
                console.log("closed.");
                game.status = "closed";
                game.statusText = "Lines are closed";
                // game.show = false;
                // var ind = $scope.gameData.indexOf(game);
                // $scope.gameData.splice(ind, 1);
            } else {
                game.show = true;
            }

            game.timeTillEvent = {};

            var updateClock = function() {
                var days, hours, minutes, seconds;
                var futureTime = new Date(game.eventDay.date).getTime();
                var currentTime = new Date().getTime() + timeOffset;
                var milliSeconds = Math.floor((futureTime - currentTime) / 1000);

                days = Math.floor(milliSeconds / 86400);
                milliSeconds -= days * 86400;
                hours = Math.floor(milliSeconds / 3600) % 24;
                milliSeconds -= hours * 3600;
                minutes = Math.floor(milliSeconds / 60) % 60;
                milliSeconds -= minutes * 60;
                seconds = milliSeconds % 60;

                game.timeTillEvent = {
                    daysLeft: days,
                    hoursLeft: hours,
                    minutesLeft: minutes,
                    secondsLeft: seconds
                }
            };

            setInterval(function() {
                $scope.$apply(updateClock);
            }, 1000);
            updateClock();
        });

    };

    // get logged in user details
    var vm = this;
    vm.user = {};

    $scope.openBets = [];
    $scope.openBetsGames = [];
    $scope.allOpenBets = [];

    $scope.gameData = [];
    // getGameData();
    function getGameData() {
        return $http.get("/games/open").success(function(response) {
            // $scope.gameData = response.data;
            // console.log('game data: ', $scope.gameData);
        });
    }

    $q.all([meanData.getProfile(), getGameData()])
    .then(function(response) {
        console.log('initial setting: ', response);
        vm.user = response[0].data;
        $scope.gameData = response[1].data.data;
        $scope.sortGamesByDate();
        getAllOpenPublicBets();
        $scope.fillUserBets();
    });

    $scope.sortGamesByDate = function() {
        var nowDate = new Date();
        var closedGames = _.filter($scope.gameData, function(game) {
            var closedDate = new Date(game.dateClose);
            return nowDate > closedDate;
        });
        closedGames = _.orderBy(closedGames, 'dateClose', 'desc');
        var openGames = _.filter($scope.gameData, function(game) {
            var closeDate = new Date(game.dateClose);
            return nowDate < closeDate;
        });
        openGames = _.orderBy(openGames, 'dateClose');
        $scope.gameData = _.concat(openGames, closedGames);
    };

    function getAllOpenPublicBets() {
        if (vm.user.settings) {
            if (vm.user.settings.betSharing) {
                $http.get('/games/openbets/public').success(function(response) {
                    // group open bets by game, line and option
                    $scope.allOpenBets = response.data;
                    $scope.allOpenBets = _.groupBy($scope.allOpenBets, 'gameId');
                    _.forEach($scope.allOpenBets, function(gameBets, gameKey) {
                        $scope.allOpenBets[gameKey] = _.groupBy(gameBets, 'lineName');
                        _.forEach($scope.allOpenBets[gameKey], function(lineBets, lineKey) {
                            $scope.allOpenBets[gameKey][lineKey] = _.groupBy(lineBets, 'optionName');
                            _.forEach($scope.allOpenBets[gameKey][lineKey], function(optionBets, optionKey) {
                                $scope.allOpenBets[gameKey][lineKey][optionKey] = _.uniqBy(optionBets, 'userId');
                            });
                        });
                    });
                    console.log('open bets: ', $scope.allOpenBets);
                    // $scope.$apply();
                });
            }
        }
    }


    $scope.Math = window.Math;
    $scope.userBets = [

    ];

    $scope.juiceMovement = {
        forevery: 100,
        movethismuch: 1
    };
    $scope.juiceChart = {};
    $scope.juiceChartSame = true;
    getJuiceChart();

    function getJuiceChart() {
        $http.get("/admin/vabe").success(function(response) {
            $scope.juiceChart = response.data[0].defaultjuice;
            $scope.juiceMovement = response.data[0].juicemovement;
            var tempArr = _.values($scope.juiceChart);
            tempArr = _.uniq(tempArr);
            if (_.size(tempArr) > 1) { $scope.juiceChartSame = false }
        });
    }

    $scope.fillUserBets = function() {

            $scope.userBets = [];
            // get games from db
            // $http.get("/games/open").success(function(response){
            var games = $scope.gameData;

            // get the bets of the user
            $http.get("/games/bets/open/" + vm.user.email).success(function(response) {
                    var myBets = response.data;
                    $scope.openBets = response.data;
                    $scope.openBetsGames = _.uniqBy(myBets, 'gameId');
                    console.log("openbetsgames")
                    console.log($scope.openBetsGames)
                    console.log("openbets")
                    console.log($scope.openBets)
                    for (var i = 0; i < $scope.openBetsGames.length; i++) {
                        $scope.openBetsGames[i].uniqueOptions = _.uniqBy($scope.openBets, 'optionName', $scope.openBetsGames[i].gameId).length;
                        // calculate the starting base odds for the game based on the
                        //number of previous bets on this game from the current user
                        var uniqueOptions = $scope.openBetsGames[i].uniqueOptions;
                        if (uniqueOptions < 3) { $scope.openBetsGames[i].baseJuice = $scope.juiceChart.onetwo }
                        if (uniqueOptions < 5 && uniqueOptions > 2) { $scope.openBetsGames[i].baseJuice = $scope.juiceChart.threefour }
                        if (uniqueOptions < 10 && uniqueOptions > 4) { $scope.openBetsGames[i].baseJuice = $scope.juiceChart.fivenine }
                        if (uniqueOptions > 9) { $scope.openBetsGames[i].baseJuice = $scope.juiceChart.all }
                    }

                    for (var i = 0; i < $scope.openBets.length; i++) {
                        var bet = $scope.openBets[i];
                        bet.adjustment = bet.betAmount / 100;
                        bet.adjustedBaseOdds = bet.odds + bet.adjustment;
                        bet.translatesTo = -$scope.openBets[0].baseJuice / (100 - $scope.openBets[0].baseJuice);
                        bet.aboveFifty = bet.translatesTo - 0.5;
                        bet.thisOption = bet.odds / 100 + bet.aboveFifty;
                        // if (bet.thisOption > 0.5) {
                        bet.toRisk = Math.round((100 * bet.thisOption) / (bet.thisOption - 1) * (bet.betAmount / 100));
                        // } else {
                        //   bet.toRisk = Math.round( 100 * (1 - bet.thisOption) / (bet.thisOption) * (bet.betAmount / 100) );
                        // }

                        // commented by Leo
                        // $http.post('/games/openbets',bet).success(function(response) {
                        // console.log(response)
                        // });
                    }
                    
                    $scope.openBets = _.groupBy($scope.openBets, 'gameId');
                    console.log("openbets after calc")
                    console.log($scope.openBets);

                    for (var g = 0; g < games.length; g++) {
                        var game = games[g];

                        $scope.gameData[g].validPreviousBetCount = 0;

                        for (var l = 0; l < games[g].lines.length; l++) {
                            var line = games[g].lines[l];
                            for (var o = 0; o < games[g].lines[l].options.length; o++) {
                                var option = games[g].lines[l].options[o];

                                // get the bets for this option
                                var bet = myBets.filter(function(bet) {
                                    if (
                                        bet.gameId === game.id &&
                                        bet.lineName === line.lineName &&
                                        bet.optionName === option.optionName) {
                                        return bet;
                                    }
                                });

                                var betTotal = 0;
                                for (var betIndex = 0; betIndex < bet.length; betIndex++) {
                                    betTotal += bet[betIndex].betAmount;
                                }
                                console.log("total bets for " + option.optionName + ": " + betTotal);

                                // previous bets by the user on this option
                                $scope.gameData[g].lines[l].options[o].previusBetsTotal = betTotal;

                                $scope.gameData[g].lines[l].options[o].optionOddsForUserView = $scope.gameData[g].lines[l].options[o].optionOdds;

                                // count how many bets he already have on this game
                                if (betTotal > 0) {
                                    $scope.gameData[g].validPreviousBetCount = $scope.gameData[g].validPreviousBetCount + 1;
                                }

                                // Example array
                                var array = [{ id: 1 }, { id: 2 }, { id: 3 }];

                                function pushIfNew(obj) {
                                    for (var i = 0; i < $scope.userBets.length; i++) {
                                        if (
                                            $scope.userBets[i].userId === obj.userId &&
                                            $scope.userBets[i].date === obj.date &&
                                            $scope.userBets[i].gameId === obj.gameId &&
                                            $scope.userBets[i].lineName === obj.lineName &&
                                            $scope.userBets[i].lineIndex === obj.lineIndex &&
                                            $scope.userBets[i].lineType === obj.lineType &&
                                            $scope.userBets[i].optionName === obj.optionName &&
                                            $scope.userBets[i].odds === obj.odds &&
                                            $scope.userBets[i].defaultOdds === obj.defaultOdds &&
                                            $scope.userBets[i].betAmount === obj.betAmount &&
                                            $scope.userBets[i].variableJuice === obj.variableJuice
                                        ) { // modify whatever property you need
                                            return;
                                        }
                                    }
                                    $scope.userBets.push(obj);
                                }

                                pushIfNew({
                                    userId: vm.user.email,
                                    date: game.dateClose,
                                    gameId: game.id,
                                    lineName: line.lineName,
                                    lineIndex: line.lineIndex,
                                    lineType: line.lineType,
                                    optionName: option.optionName,
                                    odds: option.optionJuice,
                                    defaultOdds: option.optionOdds,
                                    betAmount: betTotal,
                                    variableJuice: option.variableJuice,
                                })
                            }
                        }
                        // calculate the starting base odds for the game based on the
                        //number of previous bets on this game from the current user
                        var prevBets = $scope.gameData[g].validPreviousBetCount;
                        if (prevBets < 2) { $scope.gameData[g].baseJuice = $scope.juiceChart.onetwo }
                        if (prevBets < 4 && prevBets > 1) { $scope.gameData[g].baseJuice = $scope.juiceChart.threefour }
                        if (prevBets < 9 && prevBets > 3) { $scope.gameData[g].baseJuice = $scope.juiceChart.fivenine }
                        if (prevBets > 8) { $scope.gameData[g].baseJuice = $scope.juiceChart.all }
                        $scope.gameData[g].juiceDone = true;
                    }
                    console.log($scope.userBets)

                })
                // });
        }
        // $scope.fillUserBets();

    $scope.inputBetChanged = function(gameId, lineName, optionName, optionJuice, betAmount, option, game, index, options) {
        console.log(gameId, lineName, optionName, index, options)

        //             // vegigmegyek a betlistan, es megnezen hogy epp aktualisan melyiknel van
        //             // a legtobb betje a usernek, es megnezem mennyivel (pl 50 vs 150)
        //             // itt 100-al, tehat odds ez alapjan mozog

        for (var g = 0; g < $scope.gameData.length; g++) {
            var game = $scope.gameData[g];
            if (game.id === gameId) {
                for (var l = 0; l < $scope.gameData[g].lines.length; l++) {
                    var line = $scope.gameData[g].lines[l];
                    if (line.lineName === lineName) {
                        for (var o = 0; o < $scope.gameData[g].lines[l].options.length; o++) {
                            var option = $scope.gameData[g].lines[l].options[o];
                            if (option.optionName === optionName) {
                                $scope.gameData[g].lines[l].options[o].betAmount = betAmount;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
            break;
        }


        var bets = $scope.userBets
        for (var b = 0; b < bets.length; b++) {
            var bet = bets[b];
            if (bet.gameId === gameId && bet.lineName === lineName && bet.optionName === optionName) {
                bet.betAmount = betAmount || 0;
            }
        }

        // COUNT MAYBE NOT HERE!@!!

        // make array of bets of this game
        var betsForThisGame = [];

        for (var b = 0; b < bets.length; b++) {
            var bet = bets[b];
            if (bet.gameId === gameId) {
                betsForThisGame.push(bet);
            }
        }

        // count where bet is not 0
        var notZero = 0;

        function filterWhereBetNotZero(obj) {
            if (obj.betAmount > 0 && obj.betAmount !== undefined && typeof(obj.betAmount) === 'number' && !isNaN(obj.betAmount)) {
                notZero++;
                return true;
            } else {
                return false;
            }
        }

        // Filtered Array
        var arrNotZero = betsForThisGame.filter(filterWhereBetNotZero);
        console.log('Filtered Array\n', arrNotZero);
        console.log('Number of Valid Bets = ', notZero);

        // set base juice based on valid bets
        game.validPreviousBetCount = notZero;
        if (notZero < 3) { game.baseJuice = $scope.juiceChart.onetwo }
        if (notZero < 5 && notZero > 2) { game.baseJuice = $scope.juiceChart.threefour }
        if (notZero < 10 && notZero > 4) { game.baseJuice = $scope.juiceChart.fivenine }
        if (notZero > 9) { game.baseJuice = $scope.juiceChart.all }

        var currentBets = [];
        for (var b = 0; b < $scope.userBets.length; b++) {
            var thisBet = $scope.userBets[b];
            if (thisBet.gameId === gameId && thisBet.lineName === lineName) {
                currentBets.push(thisBet.betAmount);
            }
        }
        // var maxBet = Math.max.apply(Math, currentBets);
        // var minBet = Math.min.apply(Math, currentBets);
        // var diff = maxBet - minBet;

        // var maxBetOptionName = "";
        // for (var b = 0; b < $scope.userBets.length; b++) {
        //   var thisBet = $scope.userBets[b];
        //   if( thisBet.betAmount === maxBet && thisBet.gameId === gameId && thisBet.lineName === lineName ) {
        //     maxBetOptionName = thisBet.optionName;
        //   }
        // }
        // console.log("maxbetoptionname:"+maxBetOptionName);
        // console.log("max:"+maxBet+"min:"+minBet+"diff:"+diff);
        // console.log("betAmount:"+betAmount)

        // var pos = 0;
        // var neg = 0;
        // if(index === 0) { pos = 0; neg = 1 };
        // if(index === 1) { pos = 1; neg = 0 };
        // // change the odds
        // option.optionOdds = doc.odds;
        // option.optionOddsForUserView = option.optionOdds + diff / 100;
        // options[neg].optionOddsForUserView = option.optionOdds - diff / 100;

    };

    // SEND BET AND DIALOG
    $scope.openFromLeft = function(ev) {
        $mdDialog.show(
            $mdDialog.alert()
            // .parent(angular.element(document.querySelector('#ngview')))
            .clickOutsideToClose(true)
            .title('Opening from the left')
            .textContent('Closing to the right!')
            .ariaLabel('Left to right demo')
            .ok('Nice!')
            .targetEvent(ev)
        );
    };

    $scope.showConfirm = function(ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .clickOutsideToClose(true)
            .title('Would you like to delete your debt?')
            .textContent('All of the banks have agreed to forgive you your debts.')
            .ariaLabel('Lucky day')
            .targetEvent(ev)
            .ok('Please do it!')
            .cancel('Sounds like a scam');

        $mdDialog.show(confirm).then(function() {
            $scope.status = 'You decided to get rid of your debt.';
        }, function() {
            $scope.status = 'You decided to keep your debt.';
        });
    };

    $scope.closeModal = function() {
        $mdDialog.hide();
    };

    $scope.bet_status = '';

    $scope.modal = function(game, line, option, betAmount) {

        var textFields = $('input[type=number]');
        for (var i = 0; i < textFields.length; i++) {
            textFields[i].blur();
        }
        // get the bets for this option
        var bet = $scope.userBets.filter(function(bet) {
            if (bet.gameId === game.id &&
                bet.lineName === line.lineName &&
                bet.optionName === option.optionName) {
                return bet;
            }
        });

        var data = {
            "betAmount": betAmount || game.maxBet - option.previusBetsTotal,
            "date": game.dateClose,
            "gameId": game.id,
            "gameTitle": game.title,
            "lineName": line.lineName,
            "lineIndex": line.lineIndex,
            "odds": option.optionOdds,
            "optionName": option.optionName,
            "optionSpread": option.optionSpread,
            "userId": vm.user.email,
        };

        // console.log($scope.userBets)

        console.log(data);
        console.log(bet[0]);

        // show modal if user setting is on else send bet right away
        if (vm.user.settings.betConfirm === true) {
            // $('.ui.basic.modal').modal('show');
            
            $scope.mgame = game;
            $scope.mline = line;
            $scope.moption = option;
            $scope.mbetAmount = betAmount || game.maxBet - option.previusBetsTotal;
            $scope.mbet = bet[0];
            $scope.mjuice = ($scope.moption.optionOdds / 100) + ((-$scope.mgame.baseJuice / (100 - $scope.mgame.baseJuice)) - 0.5) > 0.5 ? Math.round((100 * (($scope.moption.optionOdds / 100) + ((-$scope.mgame.baseJuice / (100 - $scope.mgame.baseJuice)) - 0.5))) / ((($scope.moption.optionOdds / 100) + ((-$scope.mgame.baseJuice / (100 - $scope.mgame.baseJuice)) - 0.5)) - 1)) : '+' + Math.round((100 * (1 - (($scope.moption.optionOdds / 100) + ((-$scope.mgame.baseJuice / (100 - $scope.mgame.baseJuice)) - 0.5))) / (($scope.moption.optionOdds / 100) + ((-$scope.mgame.baseJuice / (100 - $scope.mgame.baseJuice)) - 0.5))));
            $scope.mrisk = $scope.mjuice > 100 ? Math.round($scope.mbetAmount * 100 / $scope.mjuice) : Math.abs($scope.mjuice * $scope.mbetAmount / 100);

            $scope.moptionSpread = "";
            if (line.lineType !== 'total') {
                if (option.optionSpread !== 0) {
                    $scope.moptionSpread = option.optionSpread > 0 ? '+' + option.optionSpread : option.optionSpread
                } else {
                    $scope.moptionSpread = "pk";
                }
            }

            $mdDialog.show({
                clickOutsideToClose: false,
                scope: $scope,
                preserveScope: true,
                templateUrl: 'confirm.modal.tmpl.html',
                // fullscreen: true,
                parent: angular.element(document.body)
            });

        } else {
            $scope.sendBet(game, line, option, data.betAmount);
        }
    }

    $scope.sendBet = function(game, line, option, betAmount) {
        if ($scope.bet_status) return;
        console.log(game, line, option)

        var oddShift = betAmount / $scope.juiceMovement.forevery * $scope.juiceMovement.movethismuch;
        var data = {
            betAmount: betAmount, //bet[0].betAmount || game.maxBet - option.previusBetsTotal,
            date: game.dateClose,
            gameId: game.id,
            gameTitle: game.title,
            lineName: line.lineName,
            lineIndex: line.lineIndex,
            lineType: line.lineType,
            odds: option.optionOdds,
            optionName: option.optionName,
            optionSpread: option.optionSpread,
            userId: vm.user.email,
            oddShift: oddShift
        };

        // console.log($scope.userBets)

        console.log(data);
        var message = { "title": "", "message": "" };
        $scope.bet_status = 'loading';
        $http.post('/games/bets', data).success(function(response) {
            if (response.responseCode === 0) {
                console.log("bet sent successfully");
                $scope.bet_status = 'success';
                $timeout(function() {
                    $mdDialog.hide();
                    $timeout(function() {
                        $scope.bet_status = '';
                    }, 500);                    
                }, 2000);
            } else {
                alert("Error sending bet");
            }
        });
        data.toRisk = $scope.mrisk;
        $http.post('/games/openbets', data);
    }

    // ADD GAME TO PAGE
    socket.on('gameAdded', function(data) {
        $scope.gameData.push(data.doc);
        $scope.sortGamesByDate();
        $scope.$apply();
    });

    // UPDATE GAME ON PAGE
    socket.on('gameUpdated', function(data) {
        for (var i = 0; i < $scope.gameData.length; i++) {
            if ($scope.gameData[i].id === data.doc.id) {
                $scope.gameData[i] = data.doc;
                $scope.sortGamesByDate();
                getAllOpenPublicBets();
                $scope.$apply();
                break;
            }
        }
    });

    // DELETE GAME ON PAGE
    socket.on('gameDeleted', function(data) {
        for (var i = 0; i < $scope.gameData.length; i++) {
            if ($scope.gameData[i].id === data.doc.id) {
                $scope.gameData.splice(i, 1);
                $scope.sortGamesByDate();
                getAllOpenPublicBets();
                $scope.$apply();
                break;
            }
        }
    });

    // UPDATE BETS
    socket.on('changeBetsFeed', function(data) {
        console.log('bet feed: ', data);
        getJuiceChart();
        if (data.game) {
            var game = data.game;
            for (var gameCounter = 0; gameCounter < $scope.gameData.length; gameCounter++) {
                if ($scope.gameData[gameCounter].id === game.id) {
                    $scope.gameData[gameCounter] = game;
                    $scope.sortGamesByDate();
                    getAllOpenPublicBets();
                    $scope.fillUserBets();
                    $scope.$apply();
                }
            }
        } else {
            for (var gameCounter = 0; gameCounter < $scope.gameData.length; gameCounter++) {
                if ($scope.gameData[gameCounter].id === data.id) {
                    $scope.gameData[gameCounter] = data.games;
                    $scope.sortGamesByDate();
                    $scope.$apply();
                }
            }
        }

        // $scope.$apply();
        // console.log("new bet on " + data.title);
        // console.log("odds: " + data.odds);
        // console.log("amount: " + data.amount);
        // console.log(data);
    });

    $scope.accordionInit = function() {
        $('.ui.accordion').accordion();
    };

});
