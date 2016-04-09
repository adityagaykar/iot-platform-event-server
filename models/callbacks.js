var mongoose = require("mongoose");
var schema = mongoose.Schema;

var callbackSchema = new schema({
	name: {type: String, required: true, index: {unique: true}},
	owner: {type: String, required: true},
	callback : {type: String, required: true},
	uri : {type: String, required: true},
	app_id : {type : String, required: true},
	created_on: {type: Date, default: Date.now}
});

module.exports = mongoose.model("callback",callbackSchema);