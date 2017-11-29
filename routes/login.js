var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/', 'login.html'));
});

router.post('/', function(req, res, next) {
  res.send('Not Implemented');
});


module.exports = router;
