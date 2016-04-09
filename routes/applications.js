var express = require('express');
var sha1 = require('sha1');
var router = express.Router();
var mongoose = require('mongoose');
var Dataset = mongoose.model("dataset");
var Application = mongoose.model("applications");

//GET datasets
router.get("/home/:id",function(req, res, next){
	Application.find(function(err, data){
		var _id = req.params.id;
		res.render("application/app_home",{user : req.session.user, id : _id});
	});
});

//Add view
router.get("/add",function(req,res,next){
	res.render("application/add");
});

//POST Dataset
router.post("/", function(req, res, next){
	var name = req.body.name;
	var owner = req.session.user._id;

	Application.create({
		name : name,
		owner : owner,
	}, function(err, dataset){
		if( err)
			res.send(err);
		res.redirect("/home");
	})
});


//DELETE Dataset

router.get("/delete/:id",function(req, res, next){
	var id = req.params.id;
	console.log(id);
	Application.remove({_id: id}).exec();	
	res.redirect("/applications");
});

module.exports = router;