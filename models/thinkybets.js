// file: models/polls.js
var thinky = require('../util/thinky.js');
var type = thinky.type;

// Create a model - the table is automatically created
var Bet = thinky.createModel("bets", {
    id: type.string(),
    userId: type.string(),
    gameId: type.string(),
    gameTitle: type.string(),
    lineName: type.string(),
    lineType: type.string(),
    optionName: type.string(),
    optionSpread: type.number(),
    betAmount: type.number(),
    toRisk: type.number(),
    odds: type.number(),
    finalized: type.boolean()
});

Bet.getJoin({toRisk: 0}).run();
// Bet.delete().run();
// Bet.filter({gameId: 'e45785a1-0fc9-4cc4-898f-e19cef2989f2'}).delete().run();

module.exports = Bet;