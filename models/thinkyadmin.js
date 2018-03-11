// file: models/polls.js
var thinky = require('../util/thinky.js');
var type = thinky.type;

// Create a model - the table is automatically created
var Admin = thinky.createModel("admin", {
    username: type.string(),
    defaultjuice: {
        onetwo: type.number(),
        threefour: type.number(),
        fivenine: type.number(),
        all: type.number()
    },
    juicemovement: {
        forevery: type.number(),
        movethismuch: type.number()
    }
});

// Admin.delete().run();

module.exports = Admin;