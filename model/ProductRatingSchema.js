var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PorductRatingTable = new Schema({
	ProductId: String,
	ProductName: String,
	userID: String, 
	AvgRating: Number, 
	NumOfVoters: Number
});
module.exports = mongoose.model('PorductRatingTable', PorductRatingTable);