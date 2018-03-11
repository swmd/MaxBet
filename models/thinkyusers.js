// file: models/polls.js
var thinky = require('../util/thinky.js');
var type = thinky.type;

// Create a model - the table is automatically created
var User = thinky.createModel("user", {
    username: type.string(),
    password: type.string(),
    balance: type.number(),
    description: type.string()
}, {
    pk: "username"
});

module.exports = User;