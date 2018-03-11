// file: models/polls.js
var thinky = require('../util/thinky.js');
var type = thinky.type;
// AUTH
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

// Create a model - the table is automatically created
var SitepointUser = thinky.createModel("sitepointuser", {
    email: type.string(),
    name: type.string(),
    balance: type.number(),
    settings: {
      betConfirm: type.boolean(),
      betSharing: type.boolean()
    },
    totalbets: type.number(),
    wins: type.number(),
    loses: type.number(),
    hash: type.string(),
    salt: type.string()
}, {
    pk: "email"
});

// ADD SALTING METHOD FOR PASSWORD
SitepointUser.define("setPassword", function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
});

// ADD SALTING METHOD FOR PASSWORD
SitepointUser.define("generatePassword", function(password){
  var password = {
    salt: crypto.randomBytes(16).toString('hex'),
    hash: crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex')
  }
  return password;
});

SitepointUser.define("validPassword", function(password){
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
  return this.hash === hash;
});

SitepointUser.define("generateJwt", function() {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign({
    id: this.id,
    email: this.email,
    name: this.name,
    balance: this.balance,
    settings: this.settings,
    exp: parseInt(expiry.getTime() / 1000),
  }, "MY_SECRET"); // DO NOT KEEP YOUR SECRET IN THE CODE!
});

SitepointUser.define("generateShortJwt", function() {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 1);

  return jwt.sign({
    id: this.id,
    email: this.email,
    name: this.name,
    balance: this.balance,
    settings: this.settings,
    exp: parseInt(expiry.getTime() / 1000),
  }, "MY_SECRET"); // DO NOT KEEP YOUR SECRET IN THE CODE!
});

SitepointUser.getJoin({
    totalbets: 0, 
    wins: 0,
    loses: 0,
    settings: {
      betSharing: true
    }
}).run();

var userbalance = {
  tim: -3738,
  brad: -7706,
  aaron: -1459,
  andy: +40,
  boyd: -1766,
  buck: -954,
  kent: -5416,
  pat: +592,
  matt: -5482,
  admin: -25889
};

// Object.keys(userbalance).forEach(function(key) {
//   var val = userbalance[key];
//   SitepointUser.get(key).run(function(error, doc) {
//     if (error) {
//       console.log('user update error: ', key, error);
//     } else {
//       // save updated vote count to db
//       doc.merge({balance: val}).save().then(function(result) {
//         console.log('user update success: ', key, doc);
//       });
//     }
//   });
// });
// SitepointUser.run(function(error, doc) {
//     if (error) {
        
//     } else {
//         doc.map(function(user) {
//           user.merge({settings: {betSharing: true}}).save();
//         })
//     }
// });

module.exports = SitepointUser;