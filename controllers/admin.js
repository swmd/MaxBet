var express = require('express');
var router = express.Router();
// require model file.
//var pollModel = require('../models/polls');
var Admin = require('../models/thinkyadmin');

router.route('/')
  .post(function(req,res) {
    // Create a new poll
    var admin = new Admin({
        username: req.body.username,
        defaultjuice: req.body.defaultjuice,
        juicemovement: req.body.juicemovement,
    });
    // Save the poll
    admin.save(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .put(function(req,res) {
    // get the current admin details from db
    Admin.get(req.body.id).run(function(error, doc) {
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

router.route('/:username')
  .get(function(req,res) {
    // Code to fetch the polls
    Admin.filter({username: req.params.username}).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  });

module.exports = router;
