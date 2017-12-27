
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
const XSCALAR = 16;
const YSCALAR = 9;
const SCROLLBOUNDRY = 250;
const ROADMULTPLIER = 8;

const UP = 1;
const DOWN = 2;
const LEFT = 3;
const RIGHT = 4;

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
    $.getJSON("../public/assets/BostonWorldMap.json", function(result){
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
    canvas.style.backgroundColor = "#b5d6a9";

    player = new createjs.Shape();
    // Create a random color
    player.graphics.beginFill("rgba("
                            + parseInt(Math.random()*255) +","
                            + parseInt(Math.random()*255) +","
                            + parseInt(Math.random()*255) +",1)").drawCircle(0, 0, 10);
    //Start at a random pos
    player.x = parseInt(Math.random()*GAMEBOUNDSX);
    player.y = parseInt(Math.random()*GAMEBOUNDSY);


    for(var i = 0; i < gameWorld.length; i++){
        drawRoad(gameWorld[i]);
        drawBuilding(gameWorld[i]);
    }
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
                    movePlayer(LEFT, PLAYER_SPEED);
                    break;
                case KEYCODE_RIGHT:
                case KEYCODE_ARRIGHT:
                    movePlayer(RIGHT, PLAYER_SPEED);
                    break;
                case KEYCODE_UP:
                case KEYCODE_ARRUP:
                    movePlayer(UP, PLAYER_SPEED);
                    break;
                case KEYCODE_DOWN:
                case KEYCODE_ARRDOWN:
                    movePlayer(DOWN, PLAYER_SPEED);
                    break;
                case KEYCODE_SHIFT:
                    PLAYER_SPEED = 8;
                    break;
            }
        }
    }
    //Prevent out of bounds** We should never get here now, but just in case :)
    if(player.y > (GAMEBOUNDSY - player.graphics.command.radius)) player.y = (GAMEBOUNDSY - player.graphics.command.radius);
    if(player.x > (GAMEBOUNDSX - player.graphics.command.radius)) player.x = (GAMEBOUNDSX - player.graphics.command.radius);
    if(player.y < player.graphics.command.radius) player.y = player.graphics.command.radius;
    if(player.x < player.graphics.command.radius) player.x = player.graphics.command.radius;

    stage.update();
}


function drawBuilding(gameObj){
    //First Check if its a building or not
    if(!getTag(gameObj,"building"))
        return;
    var newObj = new createjs.Shape();
    newObj.graphics.beginStroke("#743b0a");
    newObj.graphics.setStrokeStyle(5);
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

function drawRoad(gameObj){
    //First Check if its a road or not
    if(!getTag(gameObj,"highway"))
        return;
    var road = new createjs.Shape();
    road.graphics.beginStroke("#666666");
    var hwyWidth = getTag(gameObj,"width");
    if(hwyWidth){
        var centerLine = new createjs.Shape();
        centerLine.graphics.beginStroke("#ffcc00");
        centerLine.graphics.setStrokeStyle(1.2 * ROADMULTPLIER);
        road.graphics.setStrokeStyle(hwyWidth * ROADMULTPLIER);
    }
    else
        road.graphics.setStrokeStyle(5 * ROADMULTPLIER);
    for(var j = 0; j < gameObj.nodes.length; j++){
        var x = getRelativeX(gameObj.nodes[j].lon);
        var y = getRelativeY(gameObj.nodes[j].lat);
        //First point is a move to.
        if(j == 0){
            road.graphics.moveTo(x,y);
            if(hwyWidth)
                centerLine.graphics.moveTo(x,y);
        }
        else{
            road.graphics.lineTo(x,y);
            if(hwyWidth)
                centerLine.graphics.lineTo(x,y);
        }
    }
    worldObjects.push(road);
    stage.addChild(road);
    if(hwyWidth){
        worldObjects.push(centerLine);
        stage.addChild(centerLine);
    }
}

function movePlayer(direction, distance){
    var shouldScroll = false;
    //first check if player is at scroll limit.
    if( player.y > (GAMEBOUNDSY - SCROLLBOUNDRY) ||
        player.x > (GAMEBOUNDSX - SCROLLBOUNDRY) ||
        player.y < SCROLLBOUNDRY ||
        player.x < SCROLLBOUNDRY) shouldScroll = true;

    if( (player.y > (GAMEBOUNDSY - SCROLLBOUNDRY) && direction != DOWN) ||
        (player.x > (GAMEBOUNDSX - SCROLLBOUNDRY) && direction != LEFT) ||
        (player.y < SCROLLBOUNDRY && direction != UP) ||
        (player.x < SCROLLBOUNDRY && direction != RIGHT)) shouldScroll = false;    
    if(shouldScroll)
        moveBuildings(direction,distance);
    else//standard move within scroll box.
        move(player,direction,distance);
}

function moveBuildings(direction, distance){
    for(var i = 0; i < worldObjects.length; i++){
        move(worldObjects[i],direction,-distance);
    }
}


function move(object, direction, distance){
    switch(direction) {
        case LEFT:
            object.x += distance;
            break;
        case RIGHT:
            object.x -= distance;
            break;
        case UP:
            object.y -= distance;
            break;
        case DOWN:
            object.y += distance;
            break;
    }
}

//returns tag, if non returns false.
function getTag(gameObj, tag){   
    //no tags? return;
    if(!gameObj.tag)
        return false;

    for(var i = 0; i < gameObj.tag.length; i++){
        if(gameObj.tag[i].$.k == tag)
            return gameObj.tag[i].$.v;
    }
    return false;
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
    var x = lonPercentage * GAMEBOUNDSX * YSCALAR;
    return parseInt(x);
}

//Lat
function getRelativeY(lat){
    //first reduce
    lat = lat - coordBounds.minlat;
    var reducedMaxlat = coordBounds.maxlat - coordBounds.minlat
    //then get the ratio of location based on gamebounds.
    var latPercentage = lat / reducedMaxlat;
    var y = (latPercentage * GAMEBOUNDSY * XSCALAR);
    y = GAMEBOUNDSY - y; //WHAT Canvas and OSM have different 0,0 ??
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
