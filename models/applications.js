var mongoose = require("mongoose");
var schema = mongoose.Schema;

var applicationSchema = new schema({
	name: {type: String, required: true, index: {unique: true}},
	owner: {type: String, required: true},
	registration_key: {type: String, required: true},
	users: {type: Array},
	created_on: {type: Date, default: Date.now}
});

module.exports = mongoose.model("applications",applicationSchema);