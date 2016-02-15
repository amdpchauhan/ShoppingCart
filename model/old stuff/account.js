var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
   Name: String,
   Email:String,
   Username: String,
   Password: String,
   Role: String,
   P_no: Number
});

Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);
