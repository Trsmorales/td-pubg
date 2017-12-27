var geolib = require('geolib');
var parseString = require('xml2js').parseString;
var request = require('request');

fs = require('fs')

var newWorld = {};
var filename;
newWorld.bounds = {};
newWorld.ways = [];



function createBoundingBox(latitude,longitude,width,height,name){

    /*Arguments:    0,1 Reserved
                    2 Center Latitude
                    3 Center Longitude
                    4 Map Width (default 1600M)
                    5 Map Height (default 900M)
                    6 filename
    */

    //node routes/Utilities/mapCreator.js 42.54919 -71.46780 1600 900 SampleWorldMap.json

    latitude = latitude || process.argv[2];
    longitude = longitude || process.argv[3];
    width = width || process.argv[4];
    height = height || process.argv[5];
    filename = name || process.argv[6];

    //Start In center
    var initialPoint = {lat: latitude, lon: longitude}

    //Move up half the height
    //console.log(width)
    var dist = width / 2;
    var bearing = 0;
    var topLat = geolib.computeDestinationPoint(initialPoint, dist, bearing).latitude;

    //Now Move down half height
    bearing = 180
    var bottomLat = geolib.computeDestinationPoint(initialPoint, dist, bearing).latitude;

    //Now Move right half the width
    bearing = 90
    dist = height / 2;
    var rightLon = geolib.computeDestinationPoint(initialPoint, dist, bearing).longitude;

    //Now Move left half the width
    bearing = 270
    var leftLon = geolib.computeDestinationPoint(initialPoint, dist, bearing).longitude;

    //Output of SimpleMap Coords. Can be input to OSM
    //https://www.openstreetmap.org/api/0.6/map?bbox=left,bottom,right,top
    //to get an OSM world.
    console.log("Left Longitidue:\t" + leftLon);
    console.log("Right Longitidue:\t" + rightLon);
    console.log("Top Latitude:   \t" + topLat);
    console.log("Bottom Latitude:\t" + bottomLat);

    var url = "https://www.openstreetmap.org/api/0.6/map?bbox="
    + leftLon + ","
    + bottomLat + "," 
    + rightLon + ","
    + topLat;

    console.log("URL: \t" + url);

    return {top: topLat, bottom: bottomLat, left: leftLon, right: rightLon, url: url}
}


function GenerateWays(worldJS){
    var ways = worldJS.way;
    for(var i = 0; i < ways.length; i++){
        var way = {}
        way.nodes = [];
        //todo strip tag for supported tags only function.
        way.tag = ways[i].tag;
        for(var j = 0; j < ways[i].nd.length; j++){
        //for each ref, of each node, of each way, look up that id's coords.
        way.nodes.push(LookupCoords(ways[i].nd[j].$.ref, worldJS));
        }
        newWorld.ways.push(way);
    }
}

function LookupCoords(ref, worldJS){
    var nodes = worldJS.node
    for(var i = 0; i < nodes.length; i++){
        if(nodes[i].$.id == ref){
            return {lat: nodes[i].$.lat, lon: nodes[i].$.lon}
        }
    }

}

//Wrap everything below this in a class eventually, 
//inputs :  local or remote
//          If local, url
//          If remote, lat,log,width,height

//Get Bounding box based on input.
var boundingBox = createBoundingBox();

//Make the call to OSM
request(boundingBox.url, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    parseString(body, function (err, result) {
        //Copy Bounds
        newWorld.bounds = result.osm.bounds[0].$;
        //Create Ways
        GenerateWays(result.osm);
        //Write to file.
        fs.writeFile("./public/assets/" + filename, JSON.stringify(newWorld), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    });
});
//OR
//Read File
/*fs.readFile("./public/assets/BostonWorldMap.xml", 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    parseString(data, function (err, result) {
        //Copy Bounds
        newWorld.bounds = result.osm.bounds[0].$;
        //Create Ways
        GenerateWays(result.osm);
        //Write to file.
        fs.writeFile("./public/assets/BostonWorldMap.json", JSON.stringify(newWorld), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    });
});*/

