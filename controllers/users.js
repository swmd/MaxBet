var express = require('express');
var router = express.Router();
// require model file.
//var pollModel = require('../models/polls');
var User = require('../models/thinkyusers');
var SitepointUsers = require('../models/sitepointusers');

router.route('/')
  .get(function(req,res) {
    // Code to fetch the polls
    User.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .post(function(req,res) {
    // Create a new user
    var user = new User({
        username: req.body.username,
        password: req.body.password,
        balance: req.body.balance,
        description: req.body.description
    });
    // Save the poll
    user.save(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    User.get(req.body.username).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // save updated vote count to db
        doc.merge(req.body).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/sitepoint')
  .get(function(req,res) {
    // Code to fetch the polls
    SitepointUsers.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    SitepointUsers.get(req.body.email).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // save updated vote count to db
        doc.merge(req.body).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

router.route('/sitepoint/:userid')
  .get(function(req,res) {
    // Code to fetch the polls
    SitepointUsers.filter({email: req.params.userid}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

router.route('/sitepoint/changepw')
  .put(function(req,res) {

    var user = new SitepointUsers({
      email: req.body.email
    });
    user.setPassword(req.body.password)
    // Get the poll the user voted on from db
    SitepointUsers.get(req.body.email).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // save updated vote count to db
        doc.merge(user).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

module.exports = router;
