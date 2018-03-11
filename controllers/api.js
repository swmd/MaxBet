var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var auth = jwt({
  secret: 'MY_SECRET',
  userProperty: 'payload'
});

var ctrlProfile = require('./profile');
var ctrlAuth = require('./authentication');

// authentication
router.post('/register', ctrlAuth.register);
router.post('/login', ctrlAuth.login);

// profile
router.get('/profile', auth, ctrlProfile.profileRead);

module.exports = router;