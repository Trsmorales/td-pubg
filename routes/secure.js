var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('HO SHIT HOW U GET HERE????');
});

router.use(express.static(__dirname + '/public/secure'));

module.exports = router;
