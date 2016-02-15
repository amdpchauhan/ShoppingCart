var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserReviewTable = new Schema({
	productID: String,
	userID: String,
	userNAME: String,
	userCOMMENT: String, 
	userRating: Number,
	date: {type: Date, default: Date.now},
});
module.exports = mongoose.model('UserReviewTable', UserReviewTable);