
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

var player = {};
var opponents = [];
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
    player = new GameObject();
    // Create a random color
    player.color = "rgba("
                    + parseInt(Math.random()*255) +","
                    + parseInt(Math.random()*255) +","
                    + parseInt(Math.random()*255) +",1)";
    player.shape.graphics.beginFill(player.color).drawCircle(0, 0, 10);
    //Start at a center global pos
    player.x = parseInt(.5*GAMEBOUNDSX * XSCALAR);
    player.y = parseInt(.5*GAMEBOUNDSY * YSCALAR);

    //start at screen center
    player.shape.x = parseInt(GAMEBOUNDSX/2);//parseInt(Math.random()*(GAMEBOUNDSX));
    player.shape.y = parseInt(GAMEBOUNDSY/2);//parseInt(Math.random()*(GAMEBOUNDSY));

    for(var i = 0; i < gameWorld.length; i++){
        drawRoad(gameWorld[i]);
        drawBuilding(gameWorld[i]);
    }
    //We start bottom center because of how map is drawn
    //Move buildings to match random global pos
    moveBuildings(UP,player.y);
    moveBuildings(LEFT,player.x/2);

    stage.addChild(player.shape);
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
    if(player.shape.y > (GAMEBOUNDSY - player.shape.graphics.command.radius)) player.shape.y = (GAMEBOUNDSY - player.shape.graphics.command.radius);
    if(player.shape.x > (GAMEBOUNDSX - player.shape.graphics.command.radius)) player.shape.x = (GAMEBOUNDSX - player.shape.graphics.command.radius);
    if(player.shape.y < player.shape.graphics.command.radius) player.shape.y = player.shape.graphics.command.radius;
    if(player.shape.x < player.shape.graphics.command.radius) player.shape.x = player.shape.graphics.command.radius;

    stage.update();
}


function drawBuilding(gameObj){
    //First Check if its a building or not
    if(!getTag(gameObj,"building"))
        return;
    var newBuilding = new GameObject();
    newBuilding.shape.graphics.beginStroke("#743b0a");
    newBuilding.shape.graphics.setStrokeStyle(5);
    for(var j = 0; j < gameObj.nodes.length; j++){
        var x = getRelativeXFromLon(gameObj.nodes[j].lon);
        var y = getRelativeYFromLat(gameObj.nodes[j].lat);
        //First point is a move to.
        if(j == 0)
            newBuilding.shape.graphics.moveTo(x,y);
        else
            newBuilding.shape.graphics.lineTo(x,y);
    }
    newBuilding.shape.graphics.endStroke();
    worldObjects.push(newBuilding);
    stage.addChild(newBuilding.shape);
}

function drawRoad(gameObj){
    //First Check if its a road or not
    if(!getTag(gameObj,"highway"))
        return;
    var newRoad = new GameObject();
    newRoad.shape.graphics.beginStroke("#666666");
    var hwyWidth = getTag(gameObj,"width");
    if(hwyWidth){
        var centerLine = new GameObject();
        centerLine.shape.graphics.beginStroke("#ffcc00");
        centerLine.shape.graphics.setStrokeStyle(1.2 * ROADMULTPLIER);
        newRoad.shape.graphics.setStrokeStyle(hwyWidth * ROADMULTPLIER);
    }
    else
        newRoad.shape.graphics.setStrokeStyle(5 * ROADMULTPLIER);
    for(var j = 0; j < gameObj.nodes.length; j++){
        var x = getRelativeXFromLon(gameObj.nodes[j].lon);
        var y = getRelativeYFromLat(gameObj.nodes[j].lat);
        //First point is a move to.
        if(j == 0){
            newRoad.shape.graphics.moveTo(x,y);
            if(hwyWidth)
                centerLine.shape.graphics.moveTo(x,y);
        }
        else{
            newRoad.shape.graphics.lineTo(x,y);
            if(hwyWidth)
                centerLine.shape.graphics.lineTo(x,y);
        }
    }
    worldObjects.push(newRoad);
    stage.addChild(newRoad.shape);
    if(hwyWidth){
        worldObjects.push(centerLine);
        stage.addChild(centerLine.shape);
    }
}

function movePlayer(direction, distance){
    var shouldScroll = false;
    //first check if player is at scroll limit.
    if( player.shape.y > (GAMEBOUNDSY - SCROLLBOUNDRY) ||
        player.shape.x > (GAMEBOUNDSX - SCROLLBOUNDRY) ||
        player.shape.y < SCROLLBOUNDRY ||
        player.shape.x < SCROLLBOUNDRY) shouldScroll = true;

    if( (player.shape.y > (GAMEBOUNDSY - SCROLLBOUNDRY) && direction != DOWN) ||
        (player.shape.x > (GAMEBOUNDSX - SCROLLBOUNDRY) && direction != LEFT) ||
        (player.shape.y < SCROLLBOUNDRY && direction != UP) ||
        (player.shape.x < SCROLLBOUNDRY && direction != RIGHT)) shouldScroll = false;    
    if(shouldScroll)
        moveBuildings(direction,distance);
    else//standard move within scroll box.
        move(player.shape,direction,distance);

    updatePlayerGlobal(direction, distance)
}

function moveOpponents(sharedData, myId){
    //Now working with absolute world position.
    if(!stage) return; //init did not run yet
    for(var i = 0; i < sharedData.length; i++){
        var id = sharedData[i].id
        if(id == socket.id) //Dont draw myself.
            continue;
        if(opponents[id]) { //Old opponent
            opponents[id].shape.x = player.getRelativeX(sharedData[i].x);
            opponents[id].shape.y = player.getRelativeY(sharedData[i].y);
        } else { //New opponent
            //hold on a second we have a connection without a player yet skip this update.
            if(!sharedData[i].x || !sharedData[i].y || !sharedData[i].color) continue;

            opponents[id] = new GameObject();
            opponents[id].shape.graphics.beginFill(sharedData[i].color).drawCircle(0, 0, 10);
            opponents[id].shape.x = player.getRelativeX(sharedData[i].x);
            opponents[id].shape.y = player.getRelativeY(sharedData[i].y);
            stage.addChild(opponents[id].shape);
        }
    }
}

function moveBuildings(direction, distance){
    for(var i = 0; i < worldObjects.length; i++){
        move(worldObjects[i].shape,direction,-distance);
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

function updatePlayerGlobal(direction, distance){
    switch(direction) {
        case LEFT:
            player.x += distance;
            break;
        case RIGHT:
            player.x -= distance;
            break;
        case UP:
            player.y -= distance;
            break;
        case DOWN:
            player.y += distance;
            break;
    }
}

//Lon
function getRelativeXFromLon(lon){
    //first reduce
    lon = lon - coordBounds.minlon;
    var reducedMaxlon = coordBounds.maxlon - coordBounds.minlon
    //then get the ratio of location based on gamebounds.
    var lonPercentage = lon / reducedMaxlon;
    var x = lonPercentage * GAMEBOUNDSX * YSCALAR;
    return parseInt(x);
}

//Lat
function getRelativeYFromLat(lat){
    //first reduce
    lat = lat - coordBounds.minlat;
    var reducedMaxlat = coordBounds.maxlat - coordBounds.minlat
    //then get the ratio of location based on gamebounds.
    var latPercentage = lat / reducedMaxlat;
    var y = (latPercentage * GAMEBOUNDSY * XSCALAR);
    y = GAMEBOUNDSY - y; //WHAT Canvas and OSM have different 0,0 ??
    return parseInt(y);
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

function resetKeys(){
    for( i = 0; i < Keys.length; i++ )
    Keys[i] = false;
}

$(window).blur(function(e) {
    resetKeys();
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
                        if(player) socket.emit('playerUpdate', {id: socket.id, x: player.x, y: player.y , color: player.color});
                        }, 40);

socket.on('time', function(timeString) {
    if(serverTime)
        serverTime.innerHTML = 'Server time: ' + timeString;
        console.log("Player: "+ player.x + " , " + player.y);
});

socket.on('serverUpdate', function(sharedData) {
    moveOpponents(sharedData);
});


class GameObject {
    constructor(x=0,y=0){
        this.x = x;//Global Position
        this.y = y;//Global Position
        this.shape = new createjs.Shape();
        this.color = "rgba(0,0,0,1)";
    }

    getRelativeX(globalX){
        //If were more then a screen away dont draw
        if(!globalX || Math.abs(this.x -globalX) > GAMEBOUNDSX) return -100;
        var diff = this.x - globalX;
        return this.shape.x - diff;
    }
    
    getRelativeY(globalY){
        //If were more then a screen away dont draw
        if(!globalY || Math.abs(this.y -globalY) > GAMEBOUNDSY) return -100;
        var diff = this.y - globalY;
        return this.shape.y - diff;
    }
}
