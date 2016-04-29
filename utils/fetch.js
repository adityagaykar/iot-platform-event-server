var sha1 = require('sha1');
var mongoose = require('mongoose');
var Dataset = mongoose.model("dataset");
var Application = mongoose.model("applications");
var ApplicationUsers = mongoose.model("ApplicationUsers");
var hat = require('hat');
var Rule = mongoose.model("rule");
var Gateway = mongoose.model("gateway");
var EventDump = mongoose.model("eventdump");
var UserRule = mongoose.model("userrule");
var servers = require("../utils/servers");
var requestify = require("requestify");
var logic_server = servers.logic_server;

//setting scheduler
var scheduler = require('./scheduler');

var kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    client = new kafka.Client('localhost:2181'),
    consumer = new Consumer(
        client,
        [
            { topic: 'event', partition: 0 }
        ],
        {
            autoCommit: true
        }
    );

var handleEvent = function(js_code){
	console.log("Event message received on kafka : "+Date.now());
	var eventData = js_code;
	var header = js_code.header;
	var sensorList = js_code["body"];
	var gateway_id = header.gateway_id;
	var sensor_ids = {}; 
	console.log("GATEWAY ID : "+gateway_id);
	Gateway.update({_id : gateway_id}, {
		updated_on: Date.now() + ""
	},function(err, updated){
		if(err)
			console.log(err);
		else
			console.log("Gateway timestamp UPDATED");
	});
	EventDump.create({
		dataset : js_code
	},function(err, data){
		console.log("Event inserted in dump");
	})
	//execute events in scheduler
	console.log(JSON.stringify(eventData));
	scheduler(eventData);

	for(curr_sensor of sensorList){
		(function(sensor){
			UserRule.find({status: "enable", gateway_id: gateway_id, sensor_id: sensor.sensor_type}, function(err, rules){			
				for(curr_rule of rules){
					(function(rule,sensor){
						console.log(" Rule : "+rule.sensor_id+" | Sensor type : "+sensor.sensor_type);
						var continue_check = false;
						var curr = new Date();
						if(rule.last_triggered == "-1"){
							//fire rigthaway: first trigger					
							continue_check = true;
						} else {									
							var diff = parseInt((curr.getTime() - parseInt(rule.last_triggered))/1000);
							if(diff >= rule.frequency){						
								continue_check = true;
							} 						
						}		
						if(continue_check){	

							var condition = rule.condition;
							var threshold = rule.threshold;
							var sensor_value = sensor.sensor_data[0].value;
							var trigger = false;
							sensor_value = parseFloat(sensor_value) || sensor_value; 
							switch(condition){
								case "<":
									if(typeof sensor_value == "number"){
										threshold = parseInt(rule.threshold) || rule.threshold;
										if( sensor_value < threshold)
											trigger = true;
									}
								break;
								case ">":
									if(typeof sensor_value == "number"){										
										threshold = parseFloat(rule.threshold) || rule.threshold;
										if( sensor_value > threshold)
											trigger = true;
									}									
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
								Dataset.findOne({rule_id: rule.user_rule_id, access_token: rule.access_token}, function(err, dataset){
									if(dataset){
										var new_dataset = dataset.dataset;
										new_dataset.push({value: sensor_value, time_stamp: curr.getTime()});
										Dataset.update({rule_id: rule.user_rule_id, access_token: rule.access_token},
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
											name: hat(),
											rule_id : rule.user_rule_id,
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
									var sensor_data = {header: js_code.header, body: sensor};
									requestify.post("http://"+logic_server.hostname+":"+logic_server.port+"/callback/"+app_rule.uri, {
									    callback: app_rule.uri,
									    sensor_data: js_code,
									    access_token: rule.access_token
									},{
										timeout: 3000
									})
									.then(function(response) {
									    // Get the response body (JSON parsed or jQuery object for XMLs)
									    console.log(">"+response.getBody());
									});	
								});
								
							} else {
								console.log("Not triggered : "+sensor_value+" | "+condition+" | "+threshold+" | "+sensor.sensor_type+" | "+rule._id);
							}
							
						} else {
							//wait for next trigger
							console.log("waiting for next trigger");
						}	
					})(curr_rule,sensor);								
				}
			});
		})(curr_sensor);
			
	}
};


consumer.on('message', function (message) {
    //console.log("Received : "+JSON.stringify(message));
    var event_data = JSON.parse(message.value);
    handleEvent(event_data);
});

module.exports = consumer;
