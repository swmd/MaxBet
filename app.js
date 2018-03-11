var express = require('express');
var bodyParser = require('body-parser');
var app = express();
global.config = require('./config');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var db = require('./models/db');
var feed;
io.on('connection',function(socket) {
  feed = require('./models/feeds')(socket);
});

// SITEPOINT AUTH
var path = require('path');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var passport = require('passport');

// require('./app_api/models/db');
require('./config/passport');

// app.use('/api', routesApi);

// SITEPOINT AUTH END

/**
  Adding the controllers.
*/
app.use(bodyParser.json());
app.use(express.static(__dirname + '/view'));
app.use(require('./controllers')); //routes which does't require token authentication should be placed here
//app.use(require('./middlewares/TokenValidator')); //middleware to authenticate token
//app.use(require('./controllers/account')); //APIs to protect and use token should be placed here

app.use(passport.initialize());

// SITEPOINT AUTH
// error handlers
// Catch unauthorised errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({"message" : err.name + ": " + err.message});
  }
});

// [SH] Otherwise render the index.html page for the Angular SPA
// [SH] This means we don't have to map all of the SPA routes in Express
app.use(function(req, res) {
  res.sendFile(path.join(__dirname, 'view', 'index.html'));
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// [SH] Catch unauthorised errors
// app.use(function (err, req, res, next) {
//   if (err.name === 'UnauthorizedError') {
//     res.status(401);
//     res.json({"message" : err.name + ": " + err.message});
//   }
// });

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// SITEPOINT AUTH END

var dbModel = new db();
dbModel.setupDb();

http.listen(5000, '192.168.0.132', function(){
  console.log('listening on port 3000 '+config.port);
});