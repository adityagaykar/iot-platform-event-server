var express = require('express');
var sha1 = require('sha1');
var router = express.Router();
var mongoose = require('mongoose');
var Dataset = mongoose.model("dataset");
var Logicserver = mongoose.model("logicserver");

//GET datasets
router.get("/:id",function(req, res, next){
	var app_id = req.params.id;
	Logicserver.find({app_id : app_id},function(err, data){
		res.render("logicserver/view",{logicservers : data});
	});
});

//Add view
router.get("/add/:id",function(req,res,next){
	var app_id = req.params.id;
	res.render("logicserver/add",{app_id : app_id});
});

//POST logicserver
router.post("/", function(req, res, next){
	var name = req.body.name;
	var owner = req.session.user._id;
	var hostname = req.body.hostname;
	var port = req.body.port;
	var app_id = req.body.app_id;

	Logicserver.create({
		name : name,
		owner : owner,
		hostname : hostname,
		port: port,
		app_id: app_id
	}, function(err, dataset){
		if( err)
			res.send(err);
		res.redirect("/logicservers/"+app_id);
	})
});



//GET edit logicserver
router.get("/update/:id", function(req, res, next){
	var id = req.params.id;
	Logicserver.findOne({_id: id},function(err, logicserver){
		res.render("logicserver/edit", {name: logicserver.name, hostname: logicserver.hostname, id: logicserver._id, app_id : logicserver.app_id, port : logicserver.port});
	});	
});


//POST update logicserver
router.post("/update/:id", function(req, res, next){
	var id = req.params.id;
	var name = req.body.name;
	var owner = req.session.user._id;
	var app_id = req.body.app_id;
	var hostname = req.body.hostname;
	var port = req.body.port;
	Logicserver.update({_id: id},{
		name : name,
		owner : owner,
		app_id : app_id,
		hostname : hostname,
		port : port,		
	}, function(err, callback){
		if( err)
			res.send(err);		
		else
			res.redirect("/logicservers/"+app_id);		
	});
	
});

//DELETE logicserver

router.get("/delete/:id",function(req, res, next){
	var id = req.params.id;
	console.log(id);
	Logicserver.findOne({_id: id}, function(err, data){
		var app_id = data.app_id;
		Logicserver.remove({_id: id}).exec();	
		res.redirect("/logicservers/"+app_id);
	});
	
	
});

module.exports = router;