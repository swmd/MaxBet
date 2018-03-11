var Bets = require('./thinkybets');
var Polls = require('./thinkypolls');
var Games = require('./thinkygame');
var Admin = require('./thinkyadmin');

var stringify = function(doc) {
    return JSON.stringify(doc, null, 2);
}

var recentDocId = '';
var betsCount = 0;

function handleBetChangeEvent(doc, count, socket) {
    console.log('count: ', count, betsCount);
    if (recentDocId == doc.id || count < betsCount) {
        return;
    } else {
        console.log('=== handle bet change event ====', doc.id);
        recentDocId = doc.id;

        Games.get(doc.gameId).run().then(function(game) {
            socket.broadcast.emit("changeBetsFeed", { game: game, bet: doc});
        });
    }
}

module.exports = function(socket) {
    // WATCH BETS TABLE FOR CHANGES
    Bets.changes().then(function(feed) {
        betsCount ++;
        console.log('====== bet feed =====', betsCount);
        feed.each(function(error, doc) {
            // if (count > 0) {
            //   console.log('returning!!!!!!!!!!!');
            //   return false;
            // }
            if (error) {
                console.log(error);
                process.exit(1);
            }

            if (doc.isSaved() === false) {
                console.log("The following bet document was deleted:");
                // console.log(stringify(doc));
                socket.broadcast.emit("changeBetsFeed", { doc });
            } else if (doc.getOldValue() == null) {                
                console.log("A new bet document was inserted:");
                handleBetChangeEvent(doc, betsCount, socket);
                // console.log(stringify(doc));
                // socket.broadcast.emit("changeBetsFeed",{ doc });
            } else {
                console.log("A bet document was updated.");
                console.log("Old bet value:");
                // console.log(stringify(doc.getOldValue()));
                console.log("New bet value:");
                // console.log(stringify(doc));
                socket.broadcast.emit("changeBetsFeed", { doc });
            }
        });
    }).error(function(error) {
        console.log(error);
        process.exit(1);
    });

    // WATCH GAMES TABLE FOR CHANGES
    Games.changes().then(function(feed) {
        feed.each(function(error, doc) {
            if (error) {
                console.log(error);
                process.exit(1);
            }

            if (doc.isSaved() === false) {
                console.log("The following game document was deleted:");
                // console.log(stringify(doc));
                socket.emit("gameDeleted", { "doc": doc });
            } else if (doc.getOldValue() == null) {
                console.log("A new game was inserted:");
                // console.log(stringify(doc));
                socket.emit("gameAdded", { "doc": doc });
            } else {
                console.log("A game document was updated.");
                console.log("Old game value:");
                // console.log(stringify(doc.getOldValue()));
                console.log("New game value:");
                // console.log(stringify(doc));
                socket.emit("gameUpdated", { "doc": doc });
            }
        });
    }).error(function(error) {
        console.log(error);
        process.exit(1);
    });

    // WATCH POLLS TABLE FOR CHANGES
    Polls.changes().then(function(feed) {
        feed.each(function(error, doc) {
            if (error) {
                console.log(error);
                process.exit(1);
            }

            if (doc.isSaved() === false) {
                console.log("The following polls document was deleted:");
                // console.log(stringify(doc));
                // socket.broadcast.emit("changeBetsFeed",{ doc });
            } else if (doc.getOldValue() == null) {
                console.log("A new polls document was inserted:");
                // console.log(stringify(doc));
                socket.emit("newPollAdded", { "id": doc.id, "question": doc.question, "polls": doc.polls });
            } else {
                console.log("A polls document was updated.");
                console.log("Old poll value:");
                // console.log(stringify(doc.getOldValue()));
                console.log("New poll value:");
                // console.log(stringify(doc));
                socket.emit("changePollFeed", { "id": doc.id, "polls": doc.polls });
            }
        });
    }).error(function(error) {
        console.log(error);
        process.exit(1);
    });

};
