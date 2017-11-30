var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', function(req, res, next) {
  delete req.session.authenticated;
  res.sendFile(path.join(__dirname, '../public/', 'logout.html'));
});

module.exports = router;
