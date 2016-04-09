var mongoose = require("mongoose");
var schema = mongoose.Schema;

var logicserverSchema = new schema({
	name: {type: String, required: true, index: {unique: true}},
	owner: {type: String, required: true},
	app_id: {type: String, required: true},
	hostname : {type: String, required: true},
	port : {type: String, required: true},
	created_on: {type: Date, default: Date.now}
});

module.exports = mongoose.model("logicserver",logicserverSchema);