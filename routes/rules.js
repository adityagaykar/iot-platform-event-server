var express = require('express');
var sha1 = require('sha1');
var router = express.Router();
var mongoose = require('mongoose');
var Dataset = mongoose.model("dataset");
var Rule = mongoose.model("rule");

//GET datasets
router.get("/:id",function(req, res, next){
	var app_id = req.params.id;
	Rule.find({app_id: app_id},function(err, data){
		res.render("rules/view",{rules : data});
	});
});

//Add view
router.get("/add/:id",function(req,res,next){
	var app_id = req.params.id;
	res.render("rules/add",{app_id : app_id});
});

//POST Dataset
router.post("/", function(req, res, next){
	var name = req.body.name;	
	var owner = req.session.user._id;
	var condition = req.body.condition;
	var callback = req.body.callback;
	var app_id = req.body.app_id;
	var sensors = req.body.sensors.split(",");
	Rule.find({name: name}, function(err, data){
		if(data.length != 0){
			res.redirect("/rules/add/"+app_id);
		} else {
			Rule.create({
				name : name,
				owner : owner,
				callback : callback,
				condition : condition,
				app_id : app_id,
				sensors : sensors
			}, function(err, rule){
				if( err)
					res.send(err);
				res.redirect("/rules/"+rule.app_id);			
			});		
		}
	});
});
	

//GET edit Dataset
router.get("/update/:id", function(req, res, next){
	var id = req.params.id;

	Rule.findOne({_id: id},function(err, rule){
		res.render("rules/edit", {name: rule.name, sensors: rule.sensors.join(","),callback: rule.callback, condition: rule.condition, id: rule._id, app_id: rule.app_id});
	});	
});


//POST update dataset
router.post("/update/:id", function(req, res, next){
	var id = req.params.id;
	var name = req.body.name;
	var owner = req.session.user._id;
	var condition = req.body.condition;
	var callback = req.body.callback;
	var app_id = req.body.app_id;
	console.log("App_id : "+app_id);
	var sensors = req.body.sensors.split(",");
	Rule.update({_id: id},{
		name : name,
		owner : owner,
		callback : callback,
		condition : condition,
		app_id : app_id,
		sensors : sensors
	}, function(err, curr_rule){
		if( err)
			res.send(err);							
	});
	res.redirect("/rules/"+app_id);

});


//DELETE Dataset

router.get("/delete/:id",function(req, res, next){
	var id = req.params.id;
	console.log(id);
	Rule.findOne({_id: id},function(err,rule){
		var app_id = rule.app_id;
		Rule.remove({_id:id}).exec();
		res.redirect("/rules/"+rule.app_id);
	});	
});

module.exports = router;