var nools = require("nools");
var servers=require("./servers");
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var assert = require('assert');
var url = 'mongodb://'+servers.db_server.hostname+'/iotdb';
var requestify = require("requestify");
var logic_server = servers.logic_server;
var mongoose = require('mongoose');
var EventDump = mongoose.model("eventdump");

var Clock = function(){
    this.date = new Date();    
    this.getHours = function() {
        return this.date.getHours();
    }
    this.getMinutes = function() {
        return this.date.getMinutes();
    }
    this.hoursIsBetween = function(a, b) {
        return this.date.getHours() >= a && this.date.getHours() <=b;
    }
    this.step = function(){
        this.date = new Date();
        this.isMorning = this.hoursIsBetween(6, 11);
        this.isNoon = this.hoursIsBetween(12, 14);
        this.isAfternoon = this.hoursIsBetween(15, 17);
        this.isEvening = this.hoursIsBetween(18, 23);
        this.isNight = this.hoursIsBetween(0,5);
        return this;
    }
}

var Message = function(input){
	//this.access_token=input.access_token;
	this.body= input.body;
	this.charge=this.body[0].sensor_data[0].value;
	this.latitude = this.body[2].sensor_data[0].value;
	this.longitude = this.body[2].sensor_data[1].value;
}

//find all cars which have charge<20
var lowcharge=function(m){
    var cars = [];
    MongoClient.connect(url, function (err, db) {
  		if (err) throw err;
  		//console.log("connected");
         EventDump.find({}, function(err, docs){
            if(docs.length > 0){
                for(doc of docs){                                                
                    if(doc.dataset.body[0].sensor_data[0].value<20) {                        
                        (function(curr_data){                            
                           // console.log(">>>>>>>PUSHED>>>>>>>>");
                           if(cars.length < 10)
                                cars.push(curr_data);                        
                         })(doc.dataset);                    
                    }
                }
                var obj = { event : m, cars : cars};
                //console.log("CARS : "+cars);
                send_to_logic_server(obj, "low_charge_cars");
            }
        });
  	});   
}

//find all cars with near to current car 10km radius

var send_to_logic_server = function(js_code, callback){
    requestify.post("http://"+logic_server.hostname+":"+logic_server.port+"/callback/"+callback, {
        data: js_code                                      
    },{
        timeout: 3000
    })
    .then(function(response) {        
        console.log(">"+response.getBody());                                    
    });
}

var find_nearest=function(m){
	mylatitude=m.latitude;
	mylongitude=m.longitude;
    var cars = [];
	MongoClient.connect(url, function (err, db) {
  		if (err) throw err;
        EventDump.find({}, function(err, docs){
            if(docs.length > 0){
                for(doc of docs){                                                
                    if(doc && (doc.dataset.body[2].sensor_data[0].value-mylatitude)<=10 && (doc.dataset.body[2].sensor_data[1].value-mylongitude)<=10 ) {                        
                         (function(curr_data){                            
                            cars.push(curr_data);                        
                         })(doc.dataset);                    
                    }                                    
                }                
                var obj = { event : m, cars : cars};
                send_to_logic_server(obj, "find_nearest_car");
            }
        });
  	}); 
}



//timed events compile schedular.nools
var flow = nools.compile("./utils/rule.nools",{define: {find_nearest:find_nearest, lowcharge: lowcharge, Clock: Clock, Message: Message}});

//recieve post request here, mymsg=req.body
var executeEventRules = function(event){
    var ClockEvent = flow.getDefined("clock");
    var session1 = flow.getSession();
    session1.assert(new ClockEvent());
    session1.assert(new Message(event)); 
    session1.match().then(
        function() {
            //all done!
            console.log("All done!");
        },
        function(err) {
            console.log("Error matchUntilHalt()", err.stack);
        }
    );
};

module.exports = executeEventRules;
