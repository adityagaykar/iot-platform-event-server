var mongoose = require("mongoose");
var schema = mongoose.Schema;

var ruleSchema = new schema({
	name: {type: String, required: true, index: {unique: true}},
	owner: {type: String, required: true},
	condition : {type: String, required: true},
	callback : {type: String, required: true},
	app_id : {type : String, required: true},
	sensors : {type: Array},
	created_on: {type: Date, default: Date.now}
});

module.exports = mongoose.model("rule",ruleSchema);