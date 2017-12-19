var player;
var GAMEBOUNDSX;
var GAMEBOUNDSY;
var canvas;
var stage;
var PLAYER_SPEED = 5;
var Keys = [];
var socket = io();
var serverTime;
var serverURL;
var myID;
var opponents = {};

var KEYCODE_LEFT = 68,
    KEYCODE_RIGHT = 65,
    KEYCODE_UP = 87,
    KEYCODE_DOWN = 83;
    KEYCODE_SHIFT = 16;
    KEYCODE_ARRUP = 38;
    KEYCODE_ARRLEFT = 39;
    KEYCODE_ARRDOWN = 40;
    KEYCODE_ARRIGHT = 37;

function init() {
    stage = new createjs.Stage("canvas");
    //Update stage will render next frame
    createjs.Ticker.addEventListener("tick", handleTick);
    //Create socket connection and Gather relevent sharing objects.
    serverTime = document.getElementById('server-time');
    serverURL = document.getElementById('server-url');

    var socket = io.connect(serverURL.textContent);
    myId = socket.id;

    canvas =  document.getElementById('canvas');
    GAMEBOUNDSX = canvas.width;
    GAMEBOUNDSY = canvas.height;
    canvas.style.backgroundColor = "White";

    player = new createjs.Shape();
    // Create a random color
    player.graphics.beginFill("rgba("
                            + parseInt(Math.random()*255) +","
                            + parseInt(Math.random()*255) +","
                            + parseInt(Math.random()*255) +",1)").drawCircle(0, 0, 25);
    //Start at a random pos
    player.x = parseInt(Math.random()*GAMEBOUNDSX);
    player.y = parseInt(Math.random()*GAMEBOUNDSY);
    stage.addChild(player);
    stage.update();
}


function handleTick() {

    //reset playerspeed for any case shift is not held down
    PLAYER_SPEED = 5;

    //This isnt great but I need to think of a way to
    for(var i = 0; i < Keys.length; i++){
        var key = Keys[i];
        if(key){
            switch(i) {
            case KEYCODE_LEFT:
            case KEYCODE_ARRLEFT:
                player.x += PLAYER_SPEED;
                break;
            case KEYCODE_RIGHT:
            case KEYCODE_ARRIGHT:
                player.x -= PLAYER_SPEED;
                break;
            case KEYCODE_UP:
            case KEYCODE_ARRUP:
                player.y -= PLAYER_SPEED;
                break;
            case KEYCODE_DOWN:
            case KEYCODE_ARRDOWN:
                player.y += PLAYER_SPEED;
                break;
            case KEYCODE_SHIFT:
                PLAYER_SPEED = 8;
                break;
            }
        }
    }
    //Prevent out of bounds
    if(player.y > (GAMEBOUNDSY - 25)) player.y = (GAMEBOUNDSY - 25);
    if(player.x > (GAMEBOUNDSX - 25)) player.x = (GAMEBOUNDSX - 25);
    if(player.y < 25) player.y = 25;
    if(player.x < 25) player.x = 25;

    stage.update();
}

function drawOpponents(sharedData, myId){
    if(!stage) return; //init did not run yet
    for(var i = 0; i < sharedData.length; i++){
        var id = sharedData[i].id
        if(id == socket.id) //Dont draw myself.
            continue;
        if(opponents[id]) { //Old opponent
            opponents[id].x = sharedData[i].x;
            opponents[id].y = sharedData[i].y;
        } else { //New opponent
            opponents[id] = new createjs.Shape();
            opponents[id].graphics.beginFill("rgba(0,0,0,1)").drawCircle(0, 0, 25);
            opponents[id].x = sharedData[i].x;
            opponents[id].y = sharedData[i].y;
            stage.addChild(opponents[id]);
        }
    }
}

$(window).blur(function(e) {
  for( i = 0; i < Keys.length; i++ ) {
        Keys[i] = false;
  }
});

window.addEventListener("keydown",
    function(e){
        Keys[e.keyCode] = true;
    },
false);

window.addEventListener('keyup',
    function(e){
        Keys[e.keyCode] = false;
    },
false);

setInterval(function() {
                        if(player) socket.emit('playerUpdate', {id: socket.id, x: player.x, y: player.y });
                        }, 40);

socket.on('time', function(timeString) {
serverTime.innerHTML = 'Server time: ' + timeString;
});

socket.on('serverUpdate', function(sharedData) {
    drawOpponents(sharedData);
});
