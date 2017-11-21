var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/Add', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/Login', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/Remove', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
