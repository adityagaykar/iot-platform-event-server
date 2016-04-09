var express = require('express');
var sha1 = require('sha1');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model("User");

//GET users
router.get("/",function(req,res,next){
	
	User.find(function(err,data){
		//res.render("users",{dataset:data});
		res.send(data);
	});

});

// router.get("/users",function(req,res,next){
// 	User.find(function(err,data){
// 		res.send(data);
// 	});
// });

//POST user
router.post("/",function(req,res,next){
	var name = req.body.name;
	var password = req.body.password;
	console.log(name);
	console.log(password);
	User.create({
		name: name,
		password: sha1(password)
	},function(err,user){
		if(err)
			throw err;
		res.send(user);
	});
});

module.exports = router;