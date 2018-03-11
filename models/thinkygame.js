// file: models/polls.js
var thinky = require('../util/thinky.js');
var type = thinky.type;

// Create a model - the table is automatically created
var Game = thinky.createModel("game", {
    id: type.string(),
    title: type.string(),
    maxBet: type.number(),
    dateAvailable: type.date(),
    dateClose: type.date(),
    finalized: type.boolean(),
    lines: type.array(),
    gameLink: type.string()
});

// Game.getJoin({gameLink: ''}).run();
// Game.delete().run();

// Game.filter({id: 'e45785a1-0fc9-4cc4-898f-e19cef2989f2'}).delete().run();

module.exports = Game;