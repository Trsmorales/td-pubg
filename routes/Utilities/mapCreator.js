var geolib = require('geolib');


/*Arguments:    0,1 Reserved
                2 Center Latitude
                3 Center Longitude
                4 Map Width (default 1600M)
                5 Map Height (default 900M)
*/

//Start In center
var initialPoint = {lat: parseFloat(process.argv[2]), lon: parseFloat(process.argv[3])}

//Move up half the height
var dist = parseInt(process.argv[5]) / 2;
var bearing = 0;
var topLat = geolib.computeDestinationPoint(initialPoint, dist, bearing).latitude;

//Now Move down half height
bearing = 180
var bottomLat = geolib.computeDestinationPoint(initialPoint, dist, bearing).latitude;

//Now Move right half the height
bearing = 90
dist = parseInt(process.argv[4]) / 2;
var rightLon = geolib.computeDestinationPoint(initialPoint, dist, bearing).longitude;

//Now Move left half the height
bearing = 270
var leftLon = geolib.computeDestinationPoint(initialPoint, dist, bearing).longitude;

//Output of SimpleMap Coords. Can be input to OSM
//https://www.openstreetmap.org/api/0.6/map?bbox=left,bottom,right,top
//to get an OSM world.
console.log("Left Longitidue:\t" + leftLon);
console.log("Right Longitidue:\t" + rightLon);
console.log("Top Latitude:   \t" + topLat);
console.log("Bottom Latitude:\t" + bottomLat);

console.log("URL: \t https://www.openstreetmap.org/api/0.6/map?bbox="
                    + leftLon + ","
                    + bottomLat + "," 
                    + rightLon + ","
                    + topLat)