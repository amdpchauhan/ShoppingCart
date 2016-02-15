var express = require('express');
var router = express.Router();
//var localstorage = require('localStorage');
var nodemailer = require('nodemailer');
var async = require('async');
var passport = require('passport');
var Account = require('../model/user');
var CategorySchema = require('../model/categorySchema.js');
var ProductSchema = require('../model/productSchema.js');
var cartSchema = require('../model/cartblschema.js');
var ProductRatingSchema = require('../model/ProductRatingSchema.js');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var UserReviewSchema = require('../model/userReview.js');     
var fs = require('fs');
var categoryList="", productList="";  

var flash = require('express-flash');
var session = require('express-session');
router.use(flash());

router.use(function(req, res, next){
    // if there's a flash message in the session request, make it available in the response, then delete it
    res.locals.sessionFlash = req.session.sessionFlash;
    delete req.session.sessionFlash;
    next();
});
/* GET home page. */
router.get('/', function (req, res, next) {
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';

      ProductSchema.find({},function (error, result1) {
        if(error)
        {
          //res.send({'result':'error'});
          console.log("Got error in fetching data from database.");
        }
        else
        {
          //console.log(result);
          	var productList = result1;
            CategorySchema.find({},function (error, result2) {
		      if(error)
		      {
		        console.log("Got error in fetching data from database.");
		      }
		      else
		      {
		      	var categoryList = result2;

		      	//fetch and calculate average ratings for all products
		  		if(req.user)
		  		{//If user in LoggedIn	
		  			cartSchema.find({UserID: req.user._id}, function (error, result){
			      		if(error)
			      		{
			      			console.log('Not able to find product details');
			      		}
			      		else
			      		{	
			      			//console.log("3a");
			      			var cartinfo = result;
			      			res.render('index',{session:req.session, user : req.user, categories: categoryList, products: productList, cartdetails: cartinfo});
			  				res.end("Ending ..");		
			      		}
		      		});
		  		}
		  		else
		  		{
		  			setTimeout(function() {
						//console.log("3b");
						res.render('index',{session:req.session, user : req.user,categories: categoryList, products: productList});
			  			res.end("Ending .."); 
					}, 500);
		  		}
		      }
	   	  });
          //console.info(" result:"+ JSON.stringify(result));
        }
      });
});

router.get('/SelectedProdDetail', function (req, res, next){
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';
	
	ProductSchema.find({_id:req.query.prodid}, function (error, result){
		if(error){
			console.log("Getting an error..");
			console.log("ERRORRRR: "+error);
		}
		else
		{ 
			var productdetials = result;
			if(req.user)
			{
				cartSchema.find({UserID: req.user._id}, function (error, result1){
					if(error)
					{
						console.log('Not able to find cart details in /SelectedProdDetail.');
						console.log("ERRORRR: "+error);
					}
					else
					{	
						var carts = result1; 	
						UserReviewSchema.find({productID: req.query.prodid}, function (error, result){
							if(error){
								console.log('Not able to find cart details in /SelectedProdDetail.');
								console.log("ERRORRR: "+error);
							}
							else{
									res.render('ProductDetail', {session:req.session, user:req.user, products: productdetials, cartdetails: carts, usereviews: result });
							}
						});
					}
				});
			}
			else
			{	
				UserReviewSchema.find({productID: req.query.prodid}, function (error, result){
					if(error){
						console.log('Not able to find cart details in /SelectedProdDetail.');
						console.log("ERRORRR: "+error);
					}
					else{
						console.log("USER IS NOT LOGGED IN ");
						res.render('ProductDetail', {session:req.session, user:req.user, products: productdetials, usereviews: result});

					}
				});
			}
		}
	});
	//res.end("Pls check console..");
});

router.get('/saveProductReview', function (req, res, next){
	if(req.user){
		ProductSchema.find({_id:req.query.productID}, function (error, result){
			if(error)
			{
				console.log("GETTING ERROR IN /saveProductReview 'find function'");
				console.log(error);
			}
			else
			{	
				var numofraters = result[0].NumberOfRaters;
				var averagerating = result[0].ProductAvgRating;
				var totalRating = parseInt(numofraters)*parseInt(averagerating)+parseInt(req.query.ProductRating);

				var CalculatedRating = totalRating/(numofraters+1);
				var AvgRating = Math.round(CalculatedRating);

				console.log("NUMBER OF RATERS = "+numofraters);
				console.log("PREVIOUS RATING IS = "+averagerating);
				console.log("TOTAL RATING IS ="+totalRating);
				console.log("CALCULATED RATING IS ="+CalculatedRating);
				console.log("AVERAGE RATING = "+AvgRating); 

				ProductSchema.update({_id:req.query.productID}, {NumberOfRaters: numofraters+1,
							ProductAvgRating: AvgRating }, function (error, result)
				{
					if(error){
						console.log("GETTING ERROR IN /saveProductReview 'update function'");
						console.log(error);
					}
					else{
						var collection = new UserReviewSchema({
							productID : req.query.productID,
							userID : req.user._id, 
							userNAME : req.user.username,
							userCOMMENT : req.query.UserComment,
							userRating: req.query.ProductRating
						});
						collection.save(function (error, result){
							if(error){
								console.log("Getting error in saving user review.");
								console.log(error);
								res.send("error in saving data in user review table.");
							}		
							else{
								console.log("PRODUCT REVIEW INFO SAVED ");
								res.send('success');
							}
						});
					}
				});
			}
		});
	}
	else{
		res.send("LoginFirst");
	}
});

router.get('/categorymgmt', function (req, res, next)
{
	if(!req.user || req.user.Role=='user' )
	{
		res.statusCode = 302; 
		res.setHeader("Location", "/login");
		res.end("Please Login First.");
	}
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';
	CategorySchema.find({}, function (error, result){
		if(error)
		{
			console.log(error);
			console.log("Got some error in fetching category list.");
		}
		else
		{
			//fetch and calculate average ratings for all products
	  		var catList = result;
	  		if(req.user)
	  		{//If user in LoggedIn	
	  			cartSchema.find({UserID: req.user._id}, function (error, result){
		      		if(error)
		      		{
		      			console.log('Not able to find product details');
		      		}
		      		else
		      		{	
		      			//console.log("3a");
		      			var cartinfo = result;
		      			res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: cartinfo});
		      			//res.render('index',{session:req.session, user : req.user, categories: categoryList, products: productList, cartdetails: cartinfo});
		  				res.end("Ending ..");	
		      		}
	      		});
	  		}
	  		else
	  		{
	  			setTimeout(function() {
					//console.log("3b");
					res.render('index',{session:req.session, user : req.user,categories: categoryList, products: productList});
		  			res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: 0});
		  			res.end("Ending .."); 
				}, 500);
	  		}
			//console.log(result);
		}
	});
});

router.get('/updatecategory', function (req, res, next)
{
	CategorySchema.update({_id: req.query.catID}, {CategoryStatus: req.query.newValue}, function (error, result){
		if(error)
		{
			console.log("Not able to update category status.");
		}
		else
		{
			res.send("success");
		}
	});
});

router.get('/deletecategory', function (req, res, next)
{
	console.log(req.query.catID);
	CategorySchema.remove({_id: req.query.catID}, function (error, result){
		if(error)
		{
			console.log("Not able to remove selected category.");
		}
		else
		{
			console.log(result);
			res.send("success");
		}
	});
}); 
//redirecting to add category view page
router.get('/addcategory', function (req, res, next){
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';	
	res.render('addcategory', {session:req.session, user : req.user});
});
//action for adding new category into db
router.post('/insertcategory', function (req, res){
	var collection = new CategorySchema({
		CategoryName : req.body.CategoryName,
		CategoryStatus : req.body.CategoryStatus,		
		Description : req.body.Description
	});
	collection.save(function (err, result){
		if(err)
		{
			console.log("Category can not added.");
		}
		else
		{
			req.session.sessionFlash = {
		        type: 'categoryadded',
		        message: req.body.CategoryName+' added Successfully.'
		    }
			res.statusCode = 302; 
    		res.setHeader("Location", "/categorymgmt");
    		res.end();
			//res.re('adminhome');
		}
	});
});
router.get('/productmgmt', function (req, res, next){
	if(!req.user || req.user.Role=='user' )
	{
		res.statusCode = 302; 
		res.setHeader("Location", "/login");
		res.end("Please Login First.");	
	}
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';

	ProductSchema.find({}, function (error, result){
		if(error)
		{
			console.log(error);
			console.log("Got some error in fetching category list.");
		}
		else
		{
			//console.log(result);
			var prodList = result;
	  		if(req.user)
	  		{//If user in LoggedIn	
	  			cartSchema.find({UserID: req.user._id}, function (error, result){
		      		if(error)
		      		{
		      			console.log('Not able to find product details');
		      		}
		      		else
		      		{	
		      			//console.log("3a");
		      			var cartinfo = result;
		      			//res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: cartinfo});
		      			res.render('viewproducts', {session:req.session, user:req.user, productlist:prodList, cartdetails: cartinfo});
		      			//res.render('index',{session:req.session, user : req.user, categories: categoryList, products: productList, cartdetails: cartinfo});
		  				res.end("Ending ..");	
		      		}
	      		});
	  		}
	  		else
	  		{
	  			setTimeout(function() {
					//console.log("3b");
					//res.render('index',{session:req.session, user : req.user,categories: categoryList, products: productList});
		  			//res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: 0});
		  			res.render('viewproducts', {session:req.session, user:req.user, productlist:prodList, cartdetails: 0});
		      		res.end("Ending .."); 
				}, 500);
	  		}
		}
	});
});
router.get('/updateproduct', function (req, res, next){
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';

	ProductSchema.find({_id: req.query.prodID}, function (error, result){
		if(error)
		{
			console.log("some error in /updateproduct.");
		}
		else
		{
			var productdetails = result;
			CategorySchema.find({},function (error, result){
				if(error)
				{
					console.log("Something went wrong in selecting category in /updateproduct");
				}
				else
				{
					res.render('updateproduct', { session:req.session, user: req.user, products:productdetails, categories:result });
				}
			});
		}
	});	
});

router.post('/updateproductaction',multipartMiddleware, function (req, res, next){
	fs.readFile(req.files.ProductImage.path, function (err, data) 
    {
    	if(req.files.ProductImage.name)
    	{
    		imageName = req.files.ProductImage.name+'_'+Math.floor(Math.random()*(100000-1)+21);
		//console.log("Image name is = "+imageName);/// If there's an error
			if(!imageName)
			{
				console.log("There was an error");
				res.end("Some error occured in image upload.. Can't read image name.");
			} 
			else 
			{
			  	newPath = "./public/images/products/"+imageName;
			  	/// write file to uploads/fullsize folder
			  	fs.writeFile(newPath, data, function (err) {
				  	//Deleting main uploaded file.	
				fs.unlink(req.files.ProductImage.path, function (error){ console.log("File deleted Successfully."); });	
			  		//UPDATING RECORD WITH IMAGE FIELD
			  	ProductSchema.update({_id: req.body.productID},
			  		{
			  			ProductName: req.body.ProductName,
						ProductCategory: req.body.ProductCategory,
						ProductSalePrice: req.body.ProductSalePrice,
						ProductListPrice: req.body.ProductListPrice,
						ProductQuantityInStock: req.body.ProductQuantityInStock,
						ProductLowStockLevel: req.body.ProductLowStockLevel,
						ProductAvailable: req.body.ProductAvailable,
						ProductImage: "./images/products/"+imageName,
						ProductImageLink: req.body.ProductImageLink,
						ProductImageAltText: req.body.ProductImageAltText,
						ProductShortDescription: req.body.ProductShortDescription,
						ProductDetailedDescription: req.body.ProductDetailedDescription	
			  		}, function (error, result){
			  			if(error){
			  				console.log("Not able to update record in /updateproductaction");
			  			}
			  			else{
			  				res.statusCode = 302; 
				    		res.setHeader("Location", "/productmgmt");
				    		res.end("Product Successfully Updated");	
			  			}
			  	});	
	    		});
    		}
    	}		
    	else
    	{
    		//UPDATING RECORD EXCEPT IMAGE FIELD
    		ProductSchema.update({_id: req.body.productID},
		  		{
		  			ProductName: req.body.ProductName,
					ProductCategory: req.body.ProductCategory,
					ProductSalePrice: req.body.ProductSalePrice,
					ProductListPrice: req.body.ProductListPrice,
					ProductQuantityInStock: req.body.ProductQuantityInStock,
					ProductLowStockLevel: req.body.ProductLowStockLevel,
					ProductAvailable: req.body.ProductAvailable,
					ProductImageLink: req.body.ProductImageLink,
					ProductImageAltText: req.body.ProductImageAltText,
					ProductShortDescription: req.body.ProductShortDescription,
					ProductDetailedDescription: req.body.ProductDetailedDescription	
		  		}, function (error, result){
		  			if(error){
		  				console.log("Not able to update record in /updateproductaction");
		  			}
		  			else{
		  				res.statusCode = 302; 
			    		res.setHeader("Location", "/productmgmt");
			    		res.end("Product Successfully Updated");	
		  			}
		  	});
    	}
		
	});
});
	
router.get('/deleteproduct', function (req, res, next)
{
	console.log("productId is"+req.query.catID);
	ProductSchema.remove({_id: req.query.catID}, function (error, result){
		if(error)
		{
			console.log("Not able to remove selected category.");
		}
		else
		{
			res.send("success");
		}
	});
}); 	

//redirecting to addproduct view page
router.get('/addnewproduct', function (req, res, next){
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';	
	CategorySchema.find({},function (error, result){
		if(error)
		{
			console.log("Something went wrong.. Can't show this image.");
		}
		else
		{
			res.render('addproduct', {session:req.session, user : req.user, categories: result});		
		}
	});
});

router.post('/addproductaction', multipartMiddleware, function (request, res)
{

    //console.log("Contents are: "+JSON.stringify(request.body));
    //console.log("Files are: "+JSON.stringify(request.files));
    //var insertproduct="", newPath="", imageName="";
    //Changing file name and copying it into another folder    

    fs.readFile(request.files.ProductImage.path, function (err, data) 
    {
		imageName = request.files.ProductImage.name+'_'+Math.floor(Math.random()*(100000-1)+21);
		//console.log("Image name is = "+imageName);/// If there's an error
		if(!imageName)
		{
			console.log("There was an error");
			res.end("Some error occured in image upload.. Can't read image name.");
		} 
		else 
		{
		  	newPath = "./public/images/products/"+imageName;
		  	/// write file to uploads/fullsize folder
		  	fs.writeFile(newPath, data, function (err) {
		  		console.log("new path of image is ="+newPath);

			  	//Deleting main uploaded file.	
			  	fs.unlink(request.files.ProductImage.path, function (error){ console.log("File deleted Successfully."); });	
		  		var collection = new ProductSchema({
			    	ProductName: request.body.ProductName,
					ProductCategory: request.body.ProductCategory,
					ProductSalePrice: request.body.ProductSalePrice,
					ProductListPrice: request.body.ProductListPrice,
					ProductQuantityInStock: request.body.ProductQuantityInStock,
					ProductLowStockLevel: request.body.ProductLowStockLevel,
					ProductAvailable: request.body.ProductAvailable,
					ProductImage: "./images/products/"+imageName,
					ProductImageLink: request.body.ProductImageLink,
					ProductImageAltText: request.body.ProductImageAltText,
					ProductShortDescription: request.body.ProductShortDescription,
					ProductDetailedDescription: request.body.ProductDetailedDescription
			    });
			    collection.save(function (err, result){
			    	if(err)
			    	{
			    		console.log("Something went wrong. We cant add this item in our database.");
			    		res.end("Something went wrong. We cant add this item in our database.");
			    	}
			    	else
			    	{
			    		request.session.sessionFlash = {
					        type: 'productadded',
					        message: request.body.ProductName+' added Successfully.'
					    }
			    		res.statusCode = 302; 
			    		res.setHeader("Location", "/productmgmt");
			    		res.end("Product Successfully Updated");	
			    	}
			    });
			});
		}
	});
});

router.get('/AboutUsPage', function (req, res, next){
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';	

	if(req.user)
	{//If user in LoggedIn	
		cartSchema.find({UserID: req.user._id}, function (error, result){
	  		if(error)
	  		{
	  			console.log('Not able to find product details');
	  		}
	  		else
	  		{	
	  			//console.log("3a");
	  			var cartinfo = result;
	  			res.render('aboutus', {session:req.session, user : req.user, cartdetails: cartinfo});	//res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: 0});
				res.end("Ending ..");	
	  		}
		});
	}
	else
	{
		setTimeout(function() {
		res.render('aboutus', {session:req.session, user : req.user, cartdetails: 0});	//res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: 0});
		res.end("Ending .."); 
		}, 500);
	}
});
router.get('/ServicePage', function (req, res, next){
    if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';

	if(req.user)
	{//If user in LoggedIn	
		cartSchema.find({UserID: req.user._id}, function (error, result){
	  		if(error)
	  		{
	  			console.log('Not able to find product details');
	  		}
	  		else
	  		{	
	  			//console.log("3a");
	  			var cartinfo = result;
	  			res.render('service', {session:req.session, user : req.user, cartdetails: cartinfo});	//res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: 0});
				res.end("Ending ..");	
	  		}
		});
	}
	else
	{
		setTimeout(function() {
		res.render('service', {session:req.session, user : req.user, cartdetails: 0});	//res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: 0});
		res.end("Ending .."); 
		}, 500);
	}		
	//res.render('service.ejs', {session:req.session, user : req.user});
});
router.get('/ContactPage', function (req, res, next){
    if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';

	if(req.user)
	{//If user in LoggedIn	
		cartSchema.find({UserID: req.user._id}, function (error, result){
	  		if(error)
	  		{
	  			console.log('Not able to find product details');
	  		}
	  		else
	  		{	
	  			//console.log("3a");
	  			var cartinfo = result;
	  			res.render('contact', {session:req.session, user : req.user, cartdetails: cartinfo});	//res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: 0});
				res.end("Ending ..");	
	  		}
		});
	}
	else
	{
		setTimeout(function() {
		res.render('contact', {session:req.session, user : req.user, cartdetails: 0});	//res.render('viewcategory', {session:req.session, user:req.user, categorylist: catList, cartdetails: 0});
		res.end("Ending .."); 
		}, 500);
	}			
	//res.render('contact.ejs', {session:req.session, user : req.user});
});

router.post('/Contactusmail', function (req, res, next){
	var mailOpts, smtpTrans;
	smtpTrans = nodemailer.createTransport('SMTP', {
		service: 'Gmail',
		auth: {
			user: "amardeep.chauhan@laitkor.com",
			pass: "eaekkxcmlosxwuyn"
			} 
	});	
	mailOpts = {
		from: req.body.username + ' &lt;' + req.body.useremail + '&gt;', //grab form data from the request body object	
		to: 'amardeep.chauhan@laitkor.com',
		subject: 'Website contact us form',
		text: req.body.message
		};

	smtpTrans.sendMail(mailOpts, function (error, response) {
		if(error)
		{
			res.render('contact', { msg: 'Error occured, message not sent.', err: true});	
		}
		else
		{
			res.render('contact', {msg: 'Message sent! Thank you.', err: false});
		}
	});		
});

router.get('/addtocart', function (req, res, next){

	console.log("request body values"+JSON.stringify(req.body));
	console.log("request query values"+JSON.stringify(req.query));
	//for now redirect to home page after that redirect him to the page where he came from 
	console.log("user id is = "+req.user);
	//cartSchema
	if(req.user){
		var collection = new cartSchema({
	    	productID: req.query.productID,
			UserID: req.user._id,  
			quantity: 1,
			productPrice: req.query.productamount,
			paymentStatus: 'pending'	
	    });
	    collection.save(function (err, result){
	    	if(err)
	    	{
	    		console.log(err);
	    		console.log("Something went wrong. We cant add this cart details in our database. action=/addtocart");
	    		res.end("Something went wrong. We cant add this item in our database.");
	    	}
	    	else
	    	{
	    		console.log("new cart item is added successfully.");
	    		//console.log("Referer URL is ="+req.header('Referer'));
	    		res.statusCode = 302; 
	    		res.setHeader("Location", req.header('Referer'));
	    		res.end("Product Successfully Updated");	
	    	}
	    });
	}
	else
	{
		res.statusCode = 302; 
		res.setHeader("Location", "/login");
		res.end("Please Login First.");	
	}

});

router.get('/productcartdetails', function (req, res, next){
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';

	if(req.user)
	{
		cartSchema.find({UserID: req.user._id, paymentStatus:'pending'}, function (error, results){
			if(results=='')
			{
				console.log("CART IS EMPTY NOW.");
				res.render('cartdetailpage', {session:req.session, user: req.user, cartempty: 'true'});	
			}
			if(error)
			{
				console.log("Not getting cart items.");
				console.log(error);
			}
			if(results)
			{
				console.log("CART IS NOT EMPTY.");
				//console.log("Cart items are "+result);
				var ProductIDS = [], ProductNAMES = [], ProductimgURL = [], ProductPRICE = [], ProductSHORTDESC = [];
				var limit = results.length;
				var counter = 0; 
				for( var i=0; i<results.length; i++)
				{
					ProductSchema.find({_id: results[i].productID}, function (err, result){
						///console.log("*1*LENGTH OF RESULT IS ="+result[0].length+"**");
						if(err)
						{
							console.log("Got error in fetching record for"+result[i].productID);
							console.log(error);
						}
						if(result!='')
						{
							ProductIDS[counter] = result[0]._id;
							ProductNAMES[counter] = result[0].ProductName;
							ProductimgURL[counter] = result[0].ProductImage;
							ProductPRICE[counter] = result[0].ProductSalePrice;
							ProductSHORTDESC[counter] = result[0].ProductShortDescription;
							
							counter = counter+1;	
							//console.log("product ids are:::::::::::"+productDetails[counter]._id);
							//console.log("++++++result is+++++++"+result+"++++++.++++++");
							if(counter==limit)
							{
								//console.log("productDetails are ::::"+productDetails+"::::");
								res.render('cartdetailpage', {session:req.session, user: req.user, productid: ProductIDS, productnames: ProductNAMES, productimgurl: ProductimgURL, productprice: ProductPRICE, productshordesc: ProductSHORTDESC, cartempty: 'false'});
								//Send response to cart details page.. 
							}
						}
					});
				}
			}	
		});
	}
	else
	{
		res.statusCode = 302; 
		res.setHeader("Location", "/login");
		res.end("Please Login First.");	
	}
});

router.get('/DeleteCartProduct', function (req, res){
	//res.send("success");
	cartSchema.remove({productID: req.query.cartproductid}, function (error, result){
		if(error)
		{
			console.log("+++++ Some Error Occured in /DeleteCartProduct +++++");
			res.send("failure");
		}
		else
		{
			console.log("+++++ Cart product deleted +++++");
			res.send("success");
		}
	});
});

router.get('/paypalthank', function (req, res, next){
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';
	
	cartSchema.remove({UserID: req.user._id}, function (error, result){
		if(error){
			console.log("Got some error in /paypalthank");
			console.log(error);
		}
		else{
			console.log("Successfully cart emptied for user.");
			res.render('paypalthankpage', {session:req.session, user : req.user});
		}
	});		
});

router.get('/RateProduct', function (req, res, next){
	//console.log("====================");
	//console.log(req.query.CartProductID);
//productRating,CartProductID:,ProductRating:,ProductSchema
	if(req.user)
	{
		ProductSchema.find({_id: req.query.CartProductID}, function (error, result){
			if(error)
			{
				//console.log("+++error+++");
				//console.log("error:->"+error+"::");
				res.send("Failed in finding product in product table.");	
			}
			if(result)
			{	
				var pro_name = result[0].ProductName;
				//console.log("product table========="+result+"=========");
				//console.log("========= No record found in productrating table ====Inserting::=====");
						
				var collection = new ProductRatingSchema({
					ProductId: req.query.CartProductID,
					ProductName: pro_name, 
					userID: req.user._id,
					AvgRating: req.query.ProductRating, 
					NumOfVoters: 1
				});
				collection.save(function (error, result3){
					if(error)
					{
						console.log("---- Error: in fetching storing rating in db ----");
						res.send("Error: filed in finding product in db");
					}
					else
					{
						console.log("Product Rating saved successfully");
						res.send("success");
					}
				});
			}	
		});	
	}	
	else
	{	
		res.send("loginfirst");
	}	
});
//action for adding new product into db

router.get('/register', function(req, res) {
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';	
    res.render('register', {session:req.session, user : req.user});
});

router.post('/register', function(req, res)
{
	//console.log(req.body);
	var Name = req.body.firstname+' '+req.body.lastname;
    Account.register(new Account({username : req.body.username}), req.body.password, function(err, account) {
	    if(err)
	    {
	    	console.log(err);
	        return res.render('register', { account : account });
	    }
	    else
	    {
	    	Account.update({username: req.body.username},
	    	{
		        Name: Name,
		        Email: req.body.email,
		        Password: req.body.password,
		        Role: 'user', //Role: 'admin',
		        P_no: req.body.mobile
	    	},
	    	function (error, result)
    		{
    			if(error)
    			{
    				console.log("Registered but cant update.");
    			}
    			else
    			{
    				passport.authenticate('local')(req, res, function () {
			    	 console.log("Successfully Inserted");
			        res.redirect('/login');	
    				});
    			}		
	    	});
	    }	
	});
});  

router.get('/login', function(req, res) {
	if(req.user)
		req.session.userole = req.user.Role;
	else
		req.session.userole = '';	

	if(req.query.redirected==1)
	{
		var textmsg = "Please Login First";
	    res.render('login', { user : req.user, alrtmessage: textmsg, session: req.session});
	}
	else
	{
		console.log("here..");
		res.render('login', { user : req.user, session: req.session });		
	}
});


router.get('/ValidateUser', function (req, res){
	//res.send(req.body.username);
	console.log(req.query.username);
	console.log(req.query.password);
	var user = req.query.username;
	var pass = req.query.password;
	Account.findOne({'username': user , 'Password': pass }, function (error, result) 
	{
        if(error)
        {
            console.log("Failed");
        }
        else
        {
	          if(result==null)
	          {
	          	  res.send("Username/Password Incorrect.");
	          }
	          else
	          {
	          	  res.send("success");
	          }
        }
    });
});


router.post('/login', passport.authenticate('local'), function(req, res) {
    //console.log("Username is "+req.body.username);
	//req.session.username = req.body.username;	
	//console.log(req.session+"  SESSION IS WORKING FINE.");

	Account.find({username: req.body.username}, function (error, results)
	{
		if(results=='')
		{
			res.end("End");
		}
		if(error)
		{
			console.log("Cant find record in database.");
		}
		else
		{
			req.session.sessionFlash = {
		        type: 'loginsuccess',
		        message: 'Welcome '+req.user.username
		    }
		   	//console.log("REFERER URL IS = "+req.header('Referer'));
		    //res.statusCode = 302; 
    		//res.setHeader("Location", req.header('Referer'));
    		//res.end("Product Successfully Updated");
			res.redirect('/');
		}
	});
});



router.get('/logout', function(req, res) {
	req.session.userole='';
    req.logout();
    res.redirect('/');
});

router.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/

//router.get('/useregister', userscontroller.register, function(req, res){});

module.exports = router;

/*
<% for(kl=0; kl<userreview.length; kl++){ %>
						<div style="border:3px solid black">
							<h3></h3>
							<span id="reviewbody">
									
							</span>	
						</div>
					<% } %>	*/
/*<span id="ratingsForm" class="strating">
										<div class="stars strating" style="margin-right:0px">
											<% if(usereviews[kl].userRating==1){ %>
												<input type="radio" name="star" class="star-1 strating" id="star-1 <%= kl %>" checked="checked" readonly />	
											<% }else{ %>
												<input type="radio" name="star" class="star-1 strating" id="star-1 <%= kl %>" readonly/>
											<% } %>
											<label class="star-1" for="star-1 strating" readonly>1</label>

											<% if(usereviews[kl].userRating==2){ %>
												<input type="radio" name="star" class="star-2 strating" id="star-2 <%= kl %>" checked="checked" readonly/>	
											<% }else{ %>
												<input type="radio" name="star" class="star-2 strating" id="star-2 <%= kl %>" readonly/>
											<% } %>
											<label class="star-2" for="star-2 strating" readonly>1</label>

											<% if(usereviews[kl].userRating==3){ %>
												<input type="radio" name="star" class="star-3 strating" id="star-3 <%= kl %>" checked="checked" readonly/>	
											<% }else{ %>
												<input type="radio" name="star" class="star-3 strating" id="star-3 <%= kl %>" readonly/>
											<% } %>
											<label class="star-3" for="star-3 strating" readonly>1</label>

											<% if(usereviews[kl].userRating==4){ %>
												<input type="radio" name="star" class="star-4 strating" id="star-4 <%= kl %>" checked="checked" readonly/>	
											<% }else{ %>
												<input type="radio" name="star" class="star-4 strating" id="star-4 <%= kl %>" readonly/>
											<% } %>
											<label class="star-4" for="star-4 strating" readonly>1</label>

											<% if(usereviews[kl].userRating==5){ %>
												<input type="radio" name="star" class="star-5 strating" id="star-5 <%= kl %>" checked="checked" readonly/>	
											<% }else{ %>
												<input type="radio" name="star" class="star-5 strating" id="star-5 <%= kl %>" readonly/>
											<% } %>
											<label class="star-5" for="star-5 strating" readonly>1</label>
										<span></span>
										</div>  
										</span>*/