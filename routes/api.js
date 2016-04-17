var express = require('express');
var sha1 = require('sha1');
var router = express.Router();
var mongoose = require('mongoose');
var Dataset = mongoose.model("dataset");
var Application = mongoose.model("applications");
var ApplicationUsers = mongoose.model("ApplicationUsers");
var hat = require('hat');
var Rule = mongoose.model("rule");
var Gateway = mongoose.model("gateway");
var UserRule = mongoose.model("userrule");
var servers = require("../utils/servers");
var requestify = require("requestify");
var logic_server = servers.logic_server;

/*POST event api*/
router.post("/v1.0/event",function(req,res,next){
	var js_code = req.body.js_code;
	js_code = eval("x = "+js_code);
	var header = js_code.header;
	var sensorList = js_code["body"];
	var gateway_id = header.gateway_id;
	var sensor_ids = {};
	for(sensor of sensorList){
		UserRule.find({status: "enable", gateway_id: gateway_id, sensor_id: sensor.sensor_type}, function(err, rules){			
			for(rule of rules){
				var continue_check = false;
				var curr = new Date();
				if(rule.last_triggered == "-1"){
					//fire rigthaway: first trigger					
					continue_check = true;
				} else {									
					var diff = parseInt((curr.getTime() - parseInt(rule.last_triggered))/60000);
					if(diff >= rule.frequency){						
						continue_check = true;
					} 						
				}		
				if(continue_check){	

					var condition = rule.condition;
					var threshold = rule.threshold;
					var sensor_value = sensor.sensor_data[0].value;
					var trigger = false;
					switch(condition){
						case "<":
							sensor_value = parseInt(sensor_value);
							threshold = parseInt(rule.threshold);
							if( sensor_value < threshold)
								trigger = true;
						break;
						case ">":
							sensor_value = parseInt(sensor_value);
							threshold = parseInt(rule.threshold);
							if( sensor_value > threshold)
								trigger = true;
						break;
						case "=":
							if(sensor_value == threshold)
								trigger = true;
						break;
					}
					if(trigger){
						UserRule.update({_id: rule._id},{
							last_triggered : curr.getTime()+""
						},function(err, updated_rule){
							//do nothing
						});	
						//store event info in dataset
						Dataset.findOne({rule_id: rule.rule_id, access_token: rule.access_token}, function(err, dataset){
							if(dataset){
								var new_dataset = dataset.dataset;
								new_dataset.push({value: sensor_value, time_stamp: curr.getTime()});
								Dataset.update({rule_id: rule.rule_id, access_token: rule.access_token},
								{
									dataset : new_dataset
								},function(err, update_dataset){
									//updated;
									if(err)
										console.log(err);
									else
										console.log(">>>Dataset : UPDATED");
								});
							} else {
								Dataset.create({
									name: rule.rule_id+"_"+rule.access_token,
									rule_id : rule.rule_id,
									rule_name: rule.name,
									access_token : rule.access_token,
									dataset : [{value : sensor_value, time_stamp: curr.getTime()}]
								},function(err,data){
									//created
									if(err)
										console.log(err);
									else
										console.log(">>>Dataset : INSERTED");
								});
							}
						});
						//forward packet to logic server
						Rule.findOne({_id: rule.rule_id},function(err, app_rule){
							console.log("Sending request ...");
							requestify.post("http://"+logic_server.hostname+":"+logic_server.port+"/api/v1.0/callback", {
							    callback: app_rule.uri,
							    sensor_data: js_code,
							    access_token: rule.access_token
							})
							.then(function(response) {
							    // Get the response body (JSON parsed or jQuery object for XMLs)
							    console.log(">"+response.getBody());
							});	
						});
						
					} else {
						console.log("Not triggered : "+sensor_value+" | "+condition+" | "+threshold);
					}
					
				} else {
					//wait for next trigger
					console.log("waiting for next trigger");
				}				
			}
		});
	}
	res.send("success");

});

module.exports = router;