var express = require('express');
var router = express.Router();
var path = require('path');
var utils = require('./Utilities/utils');

router.use(checkAuth);

/* GET home page. */
router.get('/*', function(req, res, next) {
  console.log("In Secure, routing to: "+ req.path);
  if(utils.isEmpty(req.query)){
    res.render(path.join(__dirname, '../secure', req.path), {ServerURL: req.app.locals.socketAddress});
  }
  else{// only one query for now but there should be a helper function for this in utils.
    req.flash('WelcomeLogin', 'Welcome, ' + req.query.user + '!');
    console.log("Here" + req.path);
    res.render(path.join(__dirname, '../secure', req.path), {successes: req.flash('WelcomeLogin')});
  }
});

function checkAuth (req, res, next) {
	console.log('checkAuth for ' + req.url);

	// don't serve /secure to those not logged in
	// you should add to this list, for each and every secure url
	if (!req.session || !req.session.authenticated) {
    console.log('unauthorized');
		res.status(403).send('unauthorized');
		return;
	}

	next();
}

module.exports = router;
