var express = require('express');
var sha1 = require('sha1');
var router = express.Router();
var mongoose = require('mongoose');
var Dataset = mongoose.model("dataset");
var GatewayType = mongoose.model("gatewayType");

//Add view
router.get("/add",function(req,res,next){
	
	res.render("gatewaytype/add");
});

//POST Dataset
router.post("/", function(req, res, next){
	var name = req.body.name;
	var owner = req.session.user._id;
	GatewayType.create({
		name : name,
		owner : owner,
	}, function(err, dataset){
		if( err)
			res.send(err);
		res.redirect("/adminhome");
	})
});


//DELETE Dataset

router.get("/delete/:id",function(req, res, next){
	var id = req.params.id;
	console.log(id);
	GatewayType.remove({_id: id}).exec();	
	res.redirect("/adminhome");
});

module.exports = router;