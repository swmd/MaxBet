var express = require('express');
var router = express.Router();
// SITEPOINT AUTH
var jwt = require('express-jwt');
var auth = jwt({
  secret: 'MY_SECRET',
  userProperty: 'payload'
});

/**
  * @description
  * First route will handle the static html file delievery.
  * Second route will handle the API calls.
*/

router.use('/',require('./home'));
router.use('/polls',require('./polls'));
router.use('/games',require('./games'));
router.use('/admin',require('./admin'));
router.use('/users',require('./users'));
router.use('/api',require('./api'));

module.exports = router;