var express = require('express');
var sha1 = require('sha1');
var router = express.Router();
var mongoose = require('mongoose');
var Rule = mongoose.model("rule");
var helper = require("../utils/helper");

router.post("/v1.0/event",function(req,res,next){
	var header = req.body.header;
	var body = req.body.body;
	var arr = Object.keys(body.sensor_data);
	var result = "waiting";
	Rule.find({"sensors" : {$in : arr}},function(err,rules){	
		//execute every rule associated with the sensor
		for( i in rules){
			var params = [rules[i].condition, rules[i].callback];
			console.log("FOR : "+params);
			result = helper.executeRule(body.sensor_data, params);			
		}
	});
	res.send("success");
});

router.get("/v1.0/event",function(req,res,next){
	res.send("success");
});

router.post("/", function(req,res,next){
	var dataset = req.body.data;
	var arr = []
	for( data in dataset ){
		console.log(data);
		arr.push(data)
	}
	
	Rule.find({"sensors" : {$in : arr}},function(err,rules){
		var result = "waiting";
		// for( i in rules){
		// 	var sensors = rules[i].sensors			
		// 	rule = eval("x = "+rules[i].rule);						
		// 	if(!helper.evaluateCondition(rule, dataset)){
		// 		//
		// 	} else {
		// 		result += "\n"+rules[i]+" triggered";
		// 	}			
		// }
		for( i in rules){
			var rule = eval(rules[i].rule);
			console.log(rule);			
			result = helper.executeRule(dataset, rule);
			//console.log("FOR : "+result);
		}
		res.send(result);
	});
	
	
});

module.exports = router;