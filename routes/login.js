var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/', 'login.html'));
});

router.post('/', function(req, res, next) {
     console.log(JSON.stringify(req.baseUrl));
  		// you might like to do a database look-up or something more scalable here
		if ((req.body.username && req.body.username === 'josh' && req.body.password && req.body.password === 'josh') ||
        (req.body.username && req.body.username === 'brent' && req.body.password && req.body.password === 'brent'))
    {
			req.session.authenticated = true;
        console.log("Authenticated Redirecting to Secure");
			res.redirect('/secure/index.html');
		} else {
			//req.flash('error', 'Username and password are incorrect');
			res.redirect('/login');
		}
});


module.exports = router;
