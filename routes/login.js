var express = require('express');
var router = express.Router();
var path = require('path');
var utils = require('./Utilities/utils');

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
			req.flash('InvalidRegistration', 'Invalid Registration, Username Already Taken.');
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
	var redisClient = req.app.get('redisClient');
	//fail if post is somehow invalid.
	if(!req.body || !req.body.username || !req.body.password)
		res.redirect('/login?register=false');
	
	var userExists = false; 
	redisClient.get(req.body.username, function(err, reply) {
		console.log('err:' + err);
		console.log('reply: ' + reply);
		if (reply) {
			console.log('User exists, cannot register');
			res.redirect('/login?registration=false');
		} 
		else {
			console.log('User doesnt exist, continuning');
			redisClient.set(req.body.username, req.body.password, function(err, reply) {
				console.log('err:' + err);
				console.log('reply: ' + reply);
				if (reply == 'OK') {
					console.log('Created New User');
					res.redirect('/login?registration=true');
				} 
				else {
					console.log('No user created: ' + err);
					res.redirect('/login?registration=false');
				}
			});
		}
	});
	
});

router.post('/', function(req, res, next) {
    console.log(JSON.stringify(req.baseUrl));
	// First Check Local Users
	if ((req.body.username && req.body.username === 'josh' && req.body.password && req.body.password === 'josh') ||
	(req.body.username && req.body.username === 'brent' && req.body.password && req.body.password === 'brent')){
		req.session.authenticated = true;
		console.log("Authenticated Redirecting to Secure");
		res.redirect('/secure/index?user=' + req.body.username);
	} 
	// Then Check DB Users
	else {
		var redisClient = req.app.get('redisClient');
			redisClient.get(req.body.username, function(err, reply) {
			console.log('err:' + err);
			console.log('reply: ' + reply);
			if (reply) {
				//Found Username Check Password
				console.log('Username found check password.');
				if (reply == req.body.password){
					req.session.authenticated = true;
					res.redirect('/secure/index?user=' + req.body.username);
				}
				//Password doesnt match.
				else res.redirect('/login?login=false');
			} 
			else {
				console.log('Username not found ' + err);
				res.redirect('/login?login=false');
			}
		});
	}
});




module.exports = router;
