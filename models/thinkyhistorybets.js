// file: models/polls.js
var thinky = require('../util/thinky.js');
var type = thinky.type;

// Create a model - the table is automatically created
var HistoryBet = thinky.createModel("historybets", {
    id: type.string(),
    date: type.date(),
    userId: type.string(),
    gameId: type.string(),
    gameTitle: type.string(),
    lineName: type.string(),
    lineType: type.string(),
    optionName: type.string(),
    optionSpread: type.number(),
    betAmount: type.number(),
    odds: type.number(),
    adjustedBaseOdds: type.number(),
    thisOption: type.number(),
    toRisk: type.number(),
    status: type.string(),
    balance: type.number(),
    result: type.number(),
    balanceHistoryID: type.number(),
    finalized: type.boolean()
});

HistoryBet.getJoin({
    adjustedBaseOdds: 0, 
    thisOption: 0
}).run();
// HistoryBet.delete().run();

// HistoryBet.run(function(error, doc) {
//     var users = [];
//     if (error) {
//         console.log('open bet error: ', error);
//     } else {
//         for (var i = 0; i < doc.length; i ++) {
//             if (users.indexOf(doc[i].userId) < 0)
//                 users.push(doc[i].userId);
//         }
//         console.log('history bet user: ', users);
//     }
// });

// HistoryBet.filter({gameId: 'e45785a1-0fc9-4cc4-898f-e19cef2989f2'}).delete().run();

module.exports = HistoryBet;