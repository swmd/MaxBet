var passport = require('passport');
var SitepointUser = require('../models/sitepointusers');

module.exports.register = function(req, res) {

  var user = new SitepointUser({
    name: req.body.name,
    email: req.body.email,
    balance: req.body.balance,
    settings: req.body.settings
  });

  user.setPassword(req.body.password)

  user.save().then(function(doc) {
    var token;
    token = user.generateJwt();
    res.status(200);
    res.json({
      "token" : token
    });
  });
};

module.exports.login = function(req, res) {

  var keepLoggedIn = req.body.keepLoggedIn;

  passport.authenticate('local', function(err, user, info){
    var token;

    // If Passport throws/catches an error
    if (!user) {
      res.status(403).json(err);
      return;
    }

    var user = new SitepointUser({
      name: user[0].name,
      email: user[0].email,
      balance: user[0].balance,
      settings: user[0].settings,
    });

    // If a user is found
    if(user && keepLoggedIn){
      token = user.generateJwt();
      res.status(200);
      res.json({
        "token" : token
      });
    } else if(user && !keepLoggedIn){
      token = user.generateShortJwt();
      res.status(200);
      res.json({
        "token" : token
      });
    } else {
      // If user is not found
      res.status(401).json(err);
    }

  })(req, res);

};