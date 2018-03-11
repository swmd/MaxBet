var express = require('express');
var router = express.Router();
// require model file.
//var pollModel = require('../models/polls');
var SitepointUser = require('../models/sitepointusers');

router.route('/')
  .get(function(req,res) {
    // Code to fetch the polls
    SitepointUser.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : doc});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    SitepointUser.get(req.body.email).run(function(error, doc) {
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

module.exports = router;
