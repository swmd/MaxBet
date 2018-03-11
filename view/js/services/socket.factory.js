app.factory('socket',function(){
// This is where our app running.
// var socket = io.connect('https://maxonall.com');
// var socket = io.connect('http://localhost:5000');
var socket = io.connect('http://192.168.0.132:5000');
 return socket;
});
