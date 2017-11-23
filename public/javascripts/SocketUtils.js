var socketIO = require("/socket.io/socket.io.js");
var socket = io();
var el = document.getElementById('server-time');

socket.on('time', function(timeString) {
  el.innerHTML = 'Server time: ' + timeString;
});