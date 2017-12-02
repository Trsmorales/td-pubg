var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/*', function(req, res, next) {
  console.log("In Secure, routing to: "+ req.url);
  res.render(path.join(__dirname, '../secure', req.url));
});


module.exports = router;
