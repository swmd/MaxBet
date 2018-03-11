var moment = require('moment');
var _ = require('lodash');
var thinky = require('../util/thinky.js');
var r = thinky.r;
var express = require('express');
var router = express.Router();
// require model file.
//var pollModel = require('../models/polls');
var Game = require('../models/thinkygame');
var GameHistory = require('../models/thinkygamehistory');
var Bet = require('../models/thinkybets');
var ClosedBet = require('../models/thinkyclosedbets');
var HistoryBet = require('../models/thinkyhistorybets');
var OpenBet = require('../models/thinkyopenbets');
var SitepointUser = require('../models/sitepointusers');

var gameHistoryLimit = 10;

router.route('/')
  .get(function(req,res) {
    // Code to fetch the polls
    Game.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .post(function(req,res) {
    // Create a new user
    var game = new Game({
        title: req.body.title,
        maxBet: req.body.maxBet,
        dateAvailable: req.body.dateAvailable,
        dateClose: req.body.dateClose,
        finalized: false,
        lines: req.body.lines,
        gameLink: req.body.gameLink,
        bets: req.body.bets
    });
    // Save the poll
    game.save(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    Game.get(req.body.id).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // save updated vote count to db
        doc.merge(req.body).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  })
router.route('/:gameid')
  .delete(function(req, res) {
    console.log("delete game id: ", req.body.id)
    Game.get(req.params.gameid).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        Bet.filter({gameId: doc.id}).delete().run();
        ClosedBet.filter({gameId: doc.id}).delete().run();
        GameHistory.filter({title: doc.title}).delete().run();
        HistoryBet.filter({gameId: doc.id}).delete().run();
        OpenBet.filter({gameId: doc.id}).delete().run();
        doc.delete().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/open')
  .get(function(req,res) {
    // Code to fetch the polls
    Game.filter({finalized: false}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/edit/get/:gameid')
  .get(function(req,res) {
    // Code to fetch the polls
    Game.filter({id: req.params.gameid}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/bets')
  .get(function(req,res) {
    // Code to fetch the polls
    Bet.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .post(function(req,res) {
    // Create a new user
    var bet = new Bet({
        userId: req.body.userId,
        date: req.body.date,
        gameId: req.body.gameId,
        gameTitle: req.body.gameTitle,
        lineName: req.body.lineName,
        lineIndex: req.body.lineIndex,
        lineType: req.body.lineType,
        optionName: req.body.optionName,
        optionSpread: req.body.optionSpread,
        betAmount: req.body.betAmount,
        odds: req.body.odds,
        finalized: false
    });

    Game.get(req.body.gameId).run().then(function(game) {
        // find the line and option from bet
        var line = game.lines.filter(function(obj) {
            return obj.lineName === req.body.lineName;
        })[0];
        // find the option from the bet
        var option = line.options.filter(function(obj) {
            return obj.optionName === req.body.optionName;
        })[0];

        var oddShift = req.body.oddShift;
        var oddShiftModify = oddShift / (line.options.length - 1);
        console.log('shifting odds: ', req.body.betAmount, oddShift, oddShiftModify);
        var betIndex = line.options.indexOf(option);
        for (var i = 0; i < line.options.length; i++) {
            if (i == betIndex) {
                line.options[i].optionOdds = line.options[i].optionOdds + oddShift;
            } else {
                line.options[i].optionOdds = line.options[i].optionOdds - oddShiftModify;
            }
        }
        console.log('game oods were updated: ', line);
        game.merge(game).save().then(function(result) {
            // Save the poll
            // console.log('saving bet: ', bet);
            bet.save(function(error, doc) {
              if (error) {
                res.json({"responseCode" : 1, "responseDesc" : error});
              } else {
                res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
              }
            });
        });
    });    
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    console.log('updating bet');
    Bet.get(req.body.id).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // save updated vote count to db
        doc.merge(req.body).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/bets/:userid')
  .get(function(req,res) {
    // Code to fetch the polls
    Bet.filter({userId: req.params.userid}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/bets/open/:userid')
  .get(function(req,res) {
    // Code to fetch the polls
    Bet.filter({userId: req.params.userid, finalized: false})
    .run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/bets/delete/:betid')
  .delete(function(req,res) {
    // Code to fetch the polls
    console.log('deleting bets');
    Bet.get(req.params.betid).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        doc.delete().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/bets/game/:gameid')
  .get(function(req,res) {
    // Code to fetch the polls
    Bet.filter({gameId: req.params.gameid}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/closedbets')
  .get(function(req,res) {
    // Code to fetch the polls
    ClosedBet.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .post(function(req,res) {
    // Create a new user
    var closedbet = new ClosedBet({
        userId: req.body.userId,
        date: req.body.date,
        gameId: req.body.gameId,
        gameTitle: req.body.gameTitle,
        lineName: req.body.lineName,
        lineIndex: req.body.lineIndex,
        lineType: req.body.lineType,
        optionName: req.body.optionName,
        optionSpread: req.body.optionSpread,
        betAmount: req.body.betAmount,
        odds: req.body.odds,
        toRisk: req.body.toRisk,
        status: req.body.status,
        finalized: false
    });
    // Save the poll
    closedbet.save(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    ClosedBet.get(req.body.id).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // save updated vote count to db
        doc.merge(req.body).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/bethistory')
  .get(function(req,res) {
    // Code to fetch the polls
    HistoryBet.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .post(function(req,res) {
    // Create a new user
    var historybet = new HistoryBet({
        id: req.body.id,
        date: req.body.date,
        userId: req.body.userId,
        gameId: req.body.gameId,
        gameTitle: req.body.gameTitle,
        lineName: req.body.lineName,
        lineIndex: req.body.lineIndex,
        lineType: req.body.lineType,
        optionName: req.body.optionName,
        optionSpread: req.body.optionSpread,
        betAmount: req.body.betAmount,
        odds: req.body.odds,
        adjustedBaseOdds: req.body.adjustedBaseOdds,
        thisOption: req.body.thisOption,
        toRisk: req.body.toRisk,
        status: req.body.status,
        balance: req.body.balanceAfter,
        result: req.body.balanceAdjustment,
        balanceHistoryID: req.body.balanceHistoryID,
        finalized: false
    });
    // Save the poll
    historybet.save(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    HistoryBet.get(req.body.id).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // save updated vote count to db
        doc.merge(req.body).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/bethistory/:userid')
  .get(function(req,res) {
    // Code to fetch the polls
    HistoryBet.filter({userId: req.params.userid}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/bethistory/:userid/skip/:count')
  .get(function(req,res) {
    var skipCount = req.params.count;
    // Code to fetch the polls
    HistoryBet.filter({userId: req.params.userid}).orderBy(r.desc('date')).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        var gamesById = _.groupBy(doc, 'gameId');
        var games = [];
        _.forEach(gamesById, function(value, key) {
          var game = {
            gameId: key,
            bets: value
          };
          games.push(game);
        });
        var result = [];
        console.log('games length: ', games.length);
        if (games.length > skipCount) {
          var totalLength = parseInt(skipCount) + gameHistoryLimit;
          var length = (games.length > totalLength) ? totalLength : games.length;
          for (var i = skipCount; i < length; i ++) {
              var betsForGame = gamesById[games[i].gameId];
              result = result.concat(betsForGame);
          }
        }
        res.json({"responseCode" : 0, "responseDesc" : "Success", "data" : result});
      }
    });
  });

router.route('/openbets')
  .get(function(req,res) {
    // Code to fetch the polls
    OpenBet.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .post(function(req,res) {
    if (!req.body.id) {
      // if bet not in DB yet, save it
      var openbet = new OpenBet({
          id: req.body.id,
          betId: req.body.betId,
          date: req.body.date,
          userId: req.body.userId,
          gameId: req.body.gameId,
          gameTitle: req.body.gameTitle,
          lineName: req.body.lineName,
          lineIndex: req.body.lineIndex,
          lineType: req.body.lineType,
          optionName: req.body.optionName,
          optionSpread: req.body.optionSpread,
          betAmount: req.body.betAmount,
          odds: req.body.odds,
          toRisk: req.body.toRisk,
          finalized: false
      });
      // Save the poll
      openbet.save(function(error, doc) {
        if (error) {
          res.json({"responseCode" : 1, "responseDesc" : error});
        } else {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
        }
      });
    } else {
      // bet already in DB, update it
      OpenBet.get(req.body.id).run(function(error, doc) {
        if (error) {
          res.json({"responseCode" : 2, "responseDesc" : error});
        } else {
          // save updated vote count to db
          doc.merge(req.body).save().then(function(result) {
             res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
          });
        }
      })
    }
  });

router.route('/openbets/open')
  .get(function(req,res) {
    // Code to fetch the polls
    OpenBet.filter({finalized: false}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/openbets/public')
  .get(function(req,res) {
    // Code to fetch the public bets
    OpenBet.getJoin({user: true}).filter({finalized: false, user: {settings:{betSharing:true}}}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/openbets/delete/:betid')
  .delete(function(req,res) {
    // Code to fetch the polls
    OpenBet.get(req.params.betid).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        doc.delete().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/openbets/delete/game/:gameid')
  .delete(function(req,res) {
    // Code to fetch the polls
    OpenBet.filter({gameId: req.params.gameid}).delete().run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // doc.delete().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
        // });
      }
    })
  });

router.route('/gametime')
  .get(function(req,res) {
    // Code to fetch the polls
    var now = new Date();
    res.json({"responseCode" : 0, "responseDesc" : "Success","data" : now});
  });

router.route('/gamehistory')
  .get(function(req,res) {
    // Code to fetch the polls
    GameHistory.orderBy(r.desc('date')).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        var result = [];
        if (doc.length > 0) {
          var length = doc.length > gameHistoryLimit ? gameHistoryLimit : doc.length;
          for (var i = 0; i < length; i ++) {
            result.push(doc[i]);
          }
        }
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
      }
    });
  })
  .post(function(req,res) {
    var gameHistory = new GameHistory({
        gameId: req.body.id,
        title: req.body.title,
        maxBet: req.body.maxBet,
        dateAvailable: req.body.dateAvailable,
        dateClose: req.body.dateClose,
        date: req.body.date,
        finalized: false,
        lines: req.body.lines,
        gameLink: req.body.gameLink
    });
    // Save the poll
    gameHistory.save(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });   
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    GameHistory.filter({gameId: req.body.id}).run(function(error, doc) {
      if (error || doc.length == 0) {
        var gameHistory = new GameHistory({
            gameId: req.body.id,
            title: req.body.title,
            maxBet: req.body.maxBet,
            dateAvailable: req.body.dateAvailable,
            dateClose: req.body.dateClose,
            date: req.body.date,
            finalized: false,
            lines: req.body.lines,
            gameLink: req.body.gameLink
        });
        gameHistory.save(function(error, savedDoc) {
          if (error) {
            res.json({"responseCode" : 1, "responseDesc" : error});
          } else {
            res.json({"responseCode" : 0, "responseDesc" : "Success","data" : savedDoc});
          }
        });
        // return res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        var historyDoc = doc[0];
        var data = req.body;
        data.gameId = data.id;
        delete data.id;
        // console.log('---- updating game history -----');
        // console.log(historyDoc);
        // console.log(data);
        // save updated vote count to db
        historyDoc.merge(data).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/gamehistory/:gameId')
  .get(function(req,res) {
    // Code to fetch the polls
    GameHistory.filter({gameId: req.params.gameId}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })

router.route('/gamehistory/skip/:count')
  .get(function(req,res) {
    // Code to fetch the polls
    var skipCount = req.params.count;
    
    GameHistory.orderBy(r.desc('date')).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc, "error": error});
      } else {
        var result = [];
        if (doc.length > skipCount) {
          var totalLength = parseInt(skipCount) + gameHistoryLimit;
          var length = (doc.length > totalLength) ? totalLength : doc.length;
          for (var i = skipCount; i < length; i ++) {
              result.push(doc[i]);
          }
        }
        res.json({"responseCode" : 0, "responseDesc" : "Success", "data" : result});
      }
    });
  })

function isDateWithinOneWeek(date) {
  var _date = moment(date);
  var prevDate = moment().subtract(7, 'days');
  if (prevDate.isBefore(_date)) {
    return true;
  } else {
    return false;
  }
}

module.exports = router;