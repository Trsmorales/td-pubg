var player;
var GAMEBOUNDSX;
var GAMEBOUNDSY;
var canvas;
var stage; 
const PLAYER_SPEED = 5;

function init() {
    stage = new createjs.Stage("canvas");

    canvas =  document.getElementById('canvas');
    //GAMEBOUNDSX
    player = new createjs.Shape();
    player.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 25);
    player.x = 100;
    player.y = 100;
    stage.addChild(player);

    stage.update();
}

//Update stage will render next frame
//createjs.Ticker.addEventListener("tick", handleTick);

//function handleTick() {
//}

//Key Control Handler
$(document).keydown(function(keyPressed) {
    
    // UP (W)
    if (keyPressed.keyCode == 87) {
        if(player.y - PLAYER_SPEED > 0)
            player.y -= PLAYER_SPEED;
    }
    // DOWN (S)
    if (keyPressed.keyCode == 83) {
        if(player.y + PLAYER_SPEED < stage.canvas.height)
            player.y += PLAYER_SPEED;
    }
    // RIGHT (A)
    if (keyPressed.keyCode == 65) {
        if(player.x + PLAYER_SPEED > 0)
            player.x -= PLAYER_SPEED;
    }
    // LEFT (D)
    if (keyPressed.keyCode == 68) {
        if(player.x + PLAYER_SPEED < stage.canvas.width)
            player.x += PLAYER_SPEED;
    }

    stage.update();
});

