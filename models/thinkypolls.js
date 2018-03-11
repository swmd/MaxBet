// file: models/polls.js
var thinky = require('../util/thinky.js');
var type = thinky.type;

// Create a model - the table is automatically created
var Poll = thinky.createModel("poll", {
    id: type.string(),
    question: type.string(),
    polls: type.array()
});

// Poll.delete().run();

module.exports = Poll;