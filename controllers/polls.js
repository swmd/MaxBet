var express = require('express');
var router = express.Router();
// require model file.
//var pollModel = require('../models/polls');
var Poll = require('../models/thinkypolls');

router.route('/')
  .get(function(req,res) {
    // Code to fetch the polls
    Poll.run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .post(function(req,res) {
    // Create a new poll
    var poll = new Poll({
        question: req.body.question,
        polls: req.body.polls
    });
    // Save the poll
    poll.save(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        res.json({"responseCode" : 0, "responseDesc" : "Success","data" : doc});
      }
    });
  })
  .put(function(req,res) {
    // Get the poll the user voted on from db
    Poll.get(req.body.id).run(function(error, doc) {
      if (error) {
        res.json({"responseCode" : 1, "responseDesc" : error});
      } else {
        // increase vote count
        for(var pollCounter = 0; pollCounter < doc.polls.length; pollCounter++) {
          if(doc.polls[pollCounter].option === req.body.option) {
            doc.polls[pollCounter].vote += 1;
            break;
          }
        }
        // save updated vote count to db
        doc.merge(req.body.polls).save().then(function(result) {
          res.json({"responseCode" : 0, "responseDesc" : "Success","data" : result});
        });
      }
    })
  });

module.exports = router;
