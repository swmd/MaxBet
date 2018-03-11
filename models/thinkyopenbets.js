// file: models/polls.js
var thinky = require('../util/thinky.js');
var SitepointUser = require('./sitepointusers');
var type = thinky.type;

// Create a model - the table is automatically created
var OpenBet = thinky.createModel("openbets", {
    id: type.string(),
    betId: type.string(),
    userId: type.string(),
    gameId: type.string(),
    gameTitle: type.string(),
    lineName: type.string(),
    lineType: type.string(),
    optionName: type.string(),
    optionSpread: type.number(),
    betAmount: type.number(),
    odds: type.number(),
    toRisk: type.number(),
    finalized: type.boolean()
});

// OpenBet.delete().run();
OpenBet.belongsTo(SitepointUser, "user", "userId", "email");
OpenBet.getJoin({betId: ''}).run();

module.exports = OpenBet;