var mongoose = require("mongoose");
var schema = mongoose.Schema;
var sha1 = require('sha1');
var userSchema = new schema({
	name: {type: String, required: true, index: {unique: true}},
	password: {type: String, required: true},
	created_on: {type: Date, default: Date.now}
});

// // Add hashing middleware to schema
// userSchema.pre("save", function(next) {
//     var user = this;
//     // only hash password if it has been modified (or is new)
//     if (!user.isModified("password")) return next();
//     //encrypt password
//     user.password = sha1(user.password);
// });

module.exports = mongoose.model("User",userSchema);