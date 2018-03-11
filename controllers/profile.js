var SitepointUser = require('../models/sitepointusers');

module.exports.profileRead = function(req, res) {

// console.log("payload object:")
// console.log(req.payload)

  // If no user ID exists in the JWT return a 401
  if (!req.payload.email) {
    res.status(401).json({
      "message" : "UnauthorizedError: private profile"
    });
  } else {
    // Otherwise continue
    SitepointUser.get(req.payload.email).run(function(error, doc) {
    //   .findById(req.payload._id)
    //   .exec(function(err, user) {
        res.status(200).json(doc);
      });
  }

};