var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cartable = new Schema({
	productID: String,
	UserID: String,
	orderDate: {type: Date, default: Date.now}, 
	quantity: Number,
	productPrice:Number,
	paymentStatus: String	
});

module.exports = mongoose.model('cartable', cartable);