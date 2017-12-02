var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', function(req, res, next) {
  delete req.session.authenticated;
  res.render(path.join(__dirname, '../views/', 'logout'));
});

module.exports = router;
