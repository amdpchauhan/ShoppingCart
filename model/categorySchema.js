var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var category = new Schema({
  CategoryName: String, 
  CategoryStatus: String, 
  Description: String
});
module.exports = mongoose.model('category', category);