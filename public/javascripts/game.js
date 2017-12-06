var player;
var GAMEBOUNDSX;
var GAMEBOUNDSY;
var canvas;
var stage; 
const PLAYER_SPEED = 5;
var Keys = [];

var KEYCODE_LEFT = 68, 
    KEYCODE_RIGHT = 65,
    KEYCODE_UP = 87, 
    KEYCODE_DOWN = 83;

function init() {
    stage = new createjs.Stage("canvas");
    //Update stage will render next frame
    createjs.Ticker.addEventListener("tick", handleTick);

    canvas =  document.getElementById('canvas');
    GAMEBOUNDSX = canvas.width;
    GAMEBOUNDSY = canvas.height;
    canvas.style.backgroundColor = "White";

    player = new createjs.Shape();
    player.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 25);
    player.x = 100;
    player.y = 100;
    stage.addChild(player);

    stage.update();
}


function handleTick() {
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
            }
        }
    }
    //Prevent out of bounds
    if(player.y > GAMEBOUNDSY) player.y = GAMEBOUNDSY;
    if(player.X > GAMEBOUNDSY) player.X = GAMEBOUNDSX;
    if(player.Y < 0) player.Y = 0;
    if(player.X < 0) player.X = 0;

    stage.update();
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

