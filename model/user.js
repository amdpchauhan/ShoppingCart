var mongoose = require('mongoose');  
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var usertable = new Schema({
  Name: String,
  Email:String,
  Username: String,
  Password: String,
  Role: String,
  P_no: Number
});
usertable.plugin(passportLocalMongoose);
module.exports = mongoose.model('usertable', usertable);/*var mongoose = require('mongoose');  
var tbl_user = mongoose.Schema({
  Name: String,
  Email:String,
  Username: String,
  Password: String,
  Role: String,
  P_no: Number
});
var usertable = mongoose.model('usertable', tbl_user);

module.exports = {
   usertable: usertable
};*/