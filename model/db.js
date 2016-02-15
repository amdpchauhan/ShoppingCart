//added additionally
var mongoose= require("mongoose");
//Connect to mongo DB
mongoose.connect('mongodb://localhost:27017/shoppingcart');
var myDB = mongoose.connection;
//Error handling if conncetion fails
myDB.on('error', console.error.bind(console, 'connection error:'));
//Check if successful connection is made
myDB.once('open', function callback () {
  console.log("MY DB Connected with Mongoose");
});
module.exports = {
   myDB: myDB
};
//return myDB;
//added additionally