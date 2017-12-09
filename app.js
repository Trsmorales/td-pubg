var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socketIO = require('socket.io');
var http = require('http');
var debug = require('debug')('td-pubgExpressApp:server');
var session = require('express-session');
var flash = require('express-flash');
var pug = require('pug');
var redis = require('redis');
var pjson = require('./package.json');

var login = require('./routes/login');
var logout = require('./routes/logout');
var secure = require('./routes/secure');

var port = normalizePort(process.env.PORT || '3000');

var app = express();

var clientSharedData = [];

// Locals
app.locals.version = pjson.version;
app.locals.socketAddress = (process.env.PORT) ? "'https://td-pubg.herokuapp.com'" : "http://localhost:3000";
//ar options = {
//  index: 'login'
//};

var server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

var redisClient = redis.createClient(process.env.REDIS_URL 
                                      || 'redis://h:pc8c04396132ff399ff08c7b502c31ad2e6effa1edb7ca5ee82ea7506c94b2a37@ec2-34-239-85-93.compute-1.amazonaws.com:13209');

redisClient.on('connect', function() {
    console.log('Connected to redis.');
});

app.set('view engine', 'pug');
app.set('redisClient', redisClient);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: (process.env.SESSION_SECRET || 'development'),
                  resave: false,
                  saveUninitialized: false
                }));
app.use(checkAuth);
app.use('/public', express.static(path.resolve(__dirname, 'public')));
app.use(flash());

//app.use('/public', public);
app.use('/', login);
app.use('/login', login);
app.use('/logout', logout);
app.use('/secure', secure);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('Error' + err.message);
});

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected' + socket.id);
  socket.on('playerUpdate', function(playerUpdate) {
    console.log("player update from:" + playerUpdate.id);
    if(playerUpdate && playerUpdate.id)
      var found = false;
      for(var i = 0; i < clientSharedData.length; i++){
        if(clientSharedData[i].id == playerUpdate.id){//Already have this player overwrite
          clientSharedData[i] = playerUpdate;
          found = true;
        }
      }
      if(!found)//New Player Add them to the sharedData
        clientSharedData.push(playerUpdate);
  });
  socket.on('disconnect', function() {
    for(var i = 0; i < clientSharedData.length; i++){
      if(clientSharedData[i].id == socket.id){
        clientSharedData[i].x = -100;
        clientSharedData[i].y = -100;
        //push this data one last time to draw the player off the map.
        io.emit('serverUpdate', clientSharedData)
        clientSharedData.splice(i,1);
        console.log("Disconnected" + socket.id);
      }
    }
  });
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
setInterval(() => io.emit('serverUpdate', clientSharedData), 40);

module.exports = app;


function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

function checkAuth (req, res, next) {
	console.log('checkAuth for ' + req.url);

	// don't serve /secure to those not logged in
	// you should add to this list, for each and every secure url
	if (req.url.startsWith("/secure") && (!req.session || !req.session.authenticated)) {
    console.log('unauthorized');
		res.send('unauthorized', { status: 403 });
		return;
	}

	next();
}