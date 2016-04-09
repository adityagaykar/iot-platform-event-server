var express = require('express');
var sha1 = require('sha1');
var router = express.Router();
var mongoose = require('mongoose');
var Dataset = mongoose.model("dataset");
var Callback = mongoose.model("callback");

//GET datasets
router.get("/:id",function(req, res, next){
	var app_id = req.params.id;
	Callback.find({app_id: app_id},function(err, data){
		res.render("callback/view",{callbacks : data});
	});
});

//Add view
router.get("/add/:id",function(req,res,next){
	var app_id = req.params.id;
	res.render("callback/add",{app_id: app_id});
});

//POST Dataset
router.post("/", function(req, res, next){
	var name = req.body.name;
	var owner = req.session.user._id;
	var callback = req.body.callback;
	var uri = req.body.uri;
	var app_id = req.body.app_id;
	//var data = eval("x = "+callback);
	Callback.find({name: name}, function(err, data){
		if(data.length != 0){
			res.redirect("/callbacks/add/"+app_id);
		} else {
			Callback.create({
				name : name,
				owner : owner,
				app_id : app_id,
				uri : uri,
				callback : callback,
			}, function(err, callback){
				if( err)
					res.send(err);
				res.redirect("/callbacks/"+callback.app_id);
			});	
		}
	});
	
});

//GET edit Dataset
router.get("/update/:id", function(req, res, next){
	var id = req.params.id;
	Callback.findOne({_id: id},function(err, callback){
		res.render("callback/edit", {name: callback.name,uri: callback.uri, callback: callback.callback.toString(), id: callback._id, app_id : callback.app_id});
	});	
});


//POST update dataset
router.post("/update/:id", function(req, res, next){
	var id = req.params.id;
	var name = req.body.name;
	var owner = req.session.user._id;
	var app_id = req.body.app_id;
	var uri = req.body.uri;
	var callback = req.body.callback;
	Callback.update({_id: id},{
		name : name,
		owner : owner,
		app_id : app_id,
		uri : uri,
		callback : callback
	}, function(err, callback){
		if( err)
			res.send(err);		
		else
			res.redirect("/callbacks/"+app_id);		
	});
	
});


//DELETE Dataset
router.get("/delete/:id",function(req, res, next){
	var id = req.params.id;	
	Callback.findOne({_id: id},function(err,data){
		if( err)
			res.send(err);		
		else {
			var app_id = data.app_id;
			Callback.remove({_id: id}).exec();	
			res.redirect("/callbacks/"+app_id);				
		}
	});
});

module.exports = router;