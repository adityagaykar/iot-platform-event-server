var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var sha1 = require('sha1');
var Application = mongoose.model("applications");
/* GET login page. */
router.get('/', function(req, res, next) {
	var user = req.session.user;
	if(user)
		res.redirect("/home");
	var errorMessage = req.session.error;
	res.render('login', { errorMessage : errorMessage});
});

/*GET Home page*/

router.get('/home',function(req,res,next){
	var user = req.session.user;
	if(user){
		User.findOne({name:user.name, password:user.password},function(err,user){
			if (err)
				throw err;
			if (user){
				Application.find({owner : user._id},function(err, data){				
					res.render("home",{user : user, applications : data});
				});
			} else {
				req.session.error = "Invalid Username";
				res.redirect("/");
			}
		});
	} else {
		req.session.error = "Please login";
		res.redirect("/");
	}
});

/* POST: login */

router.post('/login',function(req,res, next){
	var name = req.body.username;
	var password = sha1(req.body.password);
	User.findOne({name:name, password:password},function(err,user){
		if (err)
			throw err;
		if (user){
			req.session.user = user;
			res.redirect("/home");
		} else {
			req.session.error = "Invalid Username";
			res.redirect("/");
		}
	});

});

/*GET: logout */

router.get("/logout",function(req,res,next){
	var user = req.session.user;
	if(user)
		delete req.session.user;
	if(req.session.error)
		delete req.session.error;
	res.redirect("/");
});
module.exports = router;
