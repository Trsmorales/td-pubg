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
var opponentArray = [];

var KEYCODE_LEFT = 68, 
    KEYCODE_RIGHT = 65,
    KEYCODE_UP = 87, 
    KEYCODE_DOWN = 83;
    KEYCODE_SHIFT = 16;

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
    //At this point make 20 opponents, we should change this as some point
    //All 20 will be drawn off the map, this is really bad
    for(var i = 0; i < 20; i++){
        opponentArray[i] = new createjs.Shape();
        opponentArray[i].graphics.beginFill("rgba(0,0,0,1)").drawCircle(0, 0, 25);
        opponentArray[i].x = -100;
        opponentArray[i].y = -100;
        stage.addChild(opponentArray[i]);
    }
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
                player.x += PLAYER_SPEED;
                break;
            case KEYCODE_RIGHT: 
                player.x -= PLAYER_SPEED; 
                break;
            case KEYCODE_UP: 
                player.y -= PLAYER_SPEED;
                break;
            case KEYCODE_DOWN: 
                player.y += PLAYER_SPEED;
                break;
            case KEYCODE_SHIFT:
                PLAYER_SPEED = 8;
                break;
            }
        }
    }
    //Prevent out of bounds
    if(player.y > GAMEBOUNDSY) player.y = GAMEBOUNDSY;
    if(player.x > GAMEBOUNDSX) player.x = GAMEBOUNDSX;
    if(player.y < 0) player.y = 0;
    if(player.x < 0) player.x = 0;

    stage.update();
}

function drawOpponents(sharedData, myId){
    if(opponentArray.length == 0) return;//ServerUpdate before we init the canvas, ignore this.
    for(var i = 0; i < sharedData.length; i++){
        if(sharedData[i].id != socket.id){//Dont draw myself.
        opponentArray[i].x = sharedData[i].x;
        opponentArray[i].y = sharedData[i].y;
        //console.log(sharedData[i]);
        }
    }
}


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

