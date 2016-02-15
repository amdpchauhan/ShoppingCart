var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var products = new Schema({
	ProductName: String,
	ProductCategory: String,
	ProductSalePrice: Number,
	ProductListPrice: Number,
	ProductQuantityInStock: Number,
	ProductLowStockLevel: Number,
	ProductAvailable: String,		//online,offline
	ProductImage: String,
	ProductImageLink: String,
	ProductImageAltText: String,
	ProductShortDescription: String,
	ProductDetailedDescription: String,
	ProductAvgRating: { type: Number, default: 0 },
	NumberOfRaters: { type: Number, default: 0 }
});
module.exports = mongoose.model('products', products);