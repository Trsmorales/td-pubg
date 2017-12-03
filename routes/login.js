var express = require('express');
var router = express.Router();
var path = require('path');
var utils = require('./utils');

router.get('/', function(req, res, next) {
	
	//First time here, dont yell at them.
	if(utils.isEmpty(req.query))
  		res.render(path.join(__dirname, '../views/', 'login'));

	//We were redirected from a failed login, flash how wrong they were.	  
	if(req.query.login && req.query.login == 'false'){
		req.flash('InvalidLogin', 'Invalid Login');
  		res.render(path.join(__dirname, '../views/', 'login'), {errors: req.flash('InvalidLogin')});
	}
    else if (req.query.registration){ //Registered or not?
		if (req.query.registration == 'false'){
			req.flash('InvalidRegistration', 'Invalid Registration... Probably because its not implemented.');
  			res.render(path.join(__dirname, '../views/', 'login'), {errors: req.flash('InvalidRegistration')});
		}
		else if (req.query.registration == 'true'){
			req.flash('ValidRegistration', 'Successfully Registered, Please Login.');
  			res.render(path.join(__dirname, '../views/', 'login'), {successes: req.flash('ValidRegistration')});
		}
	}
});

router.get('/invalid', function(req, res, next) {
	req.flash('InvalidLogin', 'Invalid Login');
  	res.render(path.join(__dirname, '../views/', 'login'), {errors: req.flash('InvalidLogin')});
});

router.post('/register', function(req, res, next) {
      res.redirect('/login?registration=true');
	  //todo: res.redirect('/login?register=true');
});

router.post('/', function(req, res, next) {
     console.log(JSON.stringify(req.baseUrl));
  		// you might like to do a database look-up or something more scalable here
		if ((req.body.username && req.body.username === 'josh' && req.body.password && req.body.password === 'josh') ||
        (req.body.username && req.body.username === 'brent' && req.body.password && req.body.password === 'brent'))
    	{
			req.session.authenticated = true;
        	console.log("Authenticated Redirecting to Secure");
			res.redirect('/secure/index?user=' + req.body.username);
		} else {
			//req.flash('error', 'Username and password are incorrect');
			res.redirect('/login?login=false');
		}
});




module.exports = router;
