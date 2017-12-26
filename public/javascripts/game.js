
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

var player;
var opponents = {};
var worldObjects = [];
var gameWorld;
var coordBounds;

var KEYCODE_LEFT = 68,
    KEYCODE_RIGHT = 65,
    KEYCODE_UP = 87,
    KEYCODE_DOWN = 83;
    KEYCODE_SHIFT = 16;
    KEYCODE_ARRUP = 38;
    KEYCODE_ARRLEFT = 39;
    KEYCODE_ARRDOWN = 40;
    KEYCODE_ARRIGHT = 37;

$(document).ready(function(){
    $.getJSON("../public/assets/SampleWorldMap.json", function(result){
        coordBounds = result.bounds
        gameWorld = result.ways
        init();
    });
});

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
                            + parseInt(Math.random()*255) +",1)").drawCircle(0, 0, 10);
    //Start at a random pos
    player.x = parseInt(Math.random()*GAMEBOUNDSX);
    player.y = parseInt(Math.random()*GAMEBOUNDSY);
    stage.addChild(player);

    for(var i = 0; i < gameWorld.length; i++){
        drawBuilding(gameWorld[i]);
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

function drawBuilding(gameObj){
    //First Check if its a building or not
    var isBuilding = false;

    //no tags? return;
    if(!gameObj.tag)
        return;

    for(var i = 0; i < gameObj.tag.length; i++){
        if(gameObj.tag[i].$.k == "building")
            isBuilding = true;
    }
    if(!isBuilding)
        return;

    //Were a building for now the pos is based on GAMEBOUNDS
    var newObj = new createjs.Shape();
    newObj.graphics.beginStroke("rgba(139,69,19,1)");
    //Start at 0,0
    newObj.graphics.moveTo(0,0);
    for(var j = 0; j < gameObj.nodes.length; j++){
        var x = getRelativeX(gameObj.nodes[j].lon);
        var y = getRelativeY(gameObj.nodes[j].lat);
        //First point is a move to.
        if(j == 0)
            newObj.graphics.moveTo(x,y);
        else
            newObj.graphics.lineTo(x,y);
    }
    newObj.graphics.endStroke();
    worldObjects.push(newObj);
    stage.addChild(newObj);
}

function moveOpponents(sharedData, myId){
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
            opponents[id].graphics.beginFill("rgba(0,0,0,1)").drawCircle(0, 0, 10);
            opponents[id].x = sharedData[i].x;
            opponents[id].y = sharedData[i].y;
            stage.addChild(opponents[id]);
        }
    }
}

//Lon
function getRelativeX(lon){
    //first reduce
    lon = lon - coordBounds.minlon;
    var reducedMaxlon = coordBounds.maxlon - coordBounds.minlon
    //then get the ratio of location based on gamebounds.
    var lonPercentage = lon / reducedMaxlon;
    var x = lonPercentage * GAMEBOUNDSX * 4;
    return parseInt(x);
}

//Lat
function getRelativeY(lat){
    //first reduce
    lat = lat - coordBounds.minlat;
    var reducedMaxlat = coordBounds.maxlat - coordBounds.minlat
    //then get the ratio of location based on gamebounds.
    var latPercentage = lat / reducedMaxlat;
    var y = latPercentage * GAMEBOUNDSY * 8;
    return parseInt(y);
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
    if(serverTime)
        serverTime.innerHTML = 'Server time: ' + timeString;
});

socket.on('serverUpdate', function(sharedData) {
    moveOpponents(sharedData);
});
