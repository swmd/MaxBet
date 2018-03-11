// file: models/polls.js
var thinky = require('../util/thinky.js');
var type = thinky.type;

// Create a model - the table is automatically created
var GameHistory = thinky.createModel("gamehistory", {
    id: type.string(),
    gameId: type.string(),
    title: type.string(),
    maxBet: type.number(),
    dateAvailable: type.date(),
    dateClose: type.date(),
    date: type.date(),
    finalized: type.boolean(),
    lines: type.array(),
    gameLink: type.string()
});

GameHistory.getJoin({gameId: ''}).run();
// GameHistory.delete().run();
// GameHistory.filter({title: 'test game dont bet'}).delete().run();

// var uniqueGames = [];
// GameHistory.run(function(error, doc) {
//     for (var i = 0; i < doc.length; i++) {
//         if (uniqueGames.indexOf(doc[i].gameId) < 0) {
//             uniqueGames.push(doc[i].gameId);
//         } else {
//             var gameHistory = doc[i];
//             gameHistory.delete(function() {
//                 console.log('deleted: ', doc.length);
//             });
//         }
//     }
// });

module.exports = GameHistory;