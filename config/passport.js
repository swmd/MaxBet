var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var SitepointUser = require('../models/sitepointusers');

passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function(username, password, done) {

    SitepointUser.filter({email: username}).run(function(error, doc) {
    // console.log(doc);
    // console.log(username,password)
        if (error) { return done(error); }
        // Return if user not found in database
        if (doc.length === 0) {
            return done(null, false, {
                message: 'User not found'
            });
        }

        var user = new SitepointUser({
            salt: doc[0].salt,
            hash: doc[0].hash,
            email: doc[0].email,
            name: doc[0].name,
            balance: doc[0].balance
        });

        // Return if password is wrong
        if (!user.validPassword(password)) {
            return done("Incorrect credentials", false, {
                message: 'Password is wrong'
            });
        }
        // If credentials are correct, return the user object
        return done(null, doc);
    });
  }
));

