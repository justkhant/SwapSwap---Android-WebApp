// Connect to MongoDB Atlas cluster
const mongoose = require('mongoose');
const connector = mongoose.connect("mongodb+srv://Max:Max@cis350project-8hdrl.mongodb.net/test?retryWrites=true&w=majority");

// set up Express
var express = require('express');
var app = express();

// set up EJS -- WE DON'T NEED THIS FOR OUR PROJECT, RIGHT? -Max
app.set('view engine', 'ejs');

// set up BodyParser
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(bodyParser.json( {limit: "500mb"}));
app.use(bodyParser.urlencoded({ extended: true }));


// import the User class from User.js
var User = require('./User.js');

// import the Post class from Post.js
var Post = require('./Post.js');

/************************ USER STUFF ***************************/

// route for creating a new User
// this is the action of the SignUp button on the SignUp Page
app.use('/createNewUser', (req, res) => {
	// construct the User from the form data which is in the request body
	var newUser = new User ({
		email: req.body.email,
		password: req.body.password,
		name: req.body.name,
		school: req.body.school,
		bio: "",
		rank: 0,
		points: 0,
		phoneNumber: "",
		profilePic: req.body.profilePic
	});
		
	console.log("Creating new User...");
	console.log("Email: " + newUser.email);
	console.log("Password: " + newUser.password);
	console.log("Name: " + newUser.name);
	console.log("School: " + newUser.school);
	console.log("Strong default profile picture...")
	
	// save the user to the database
	newUser.save( (err) => { 
		if (err) {
		    res.type('html').status(200);
		    res.write('uh oh: ' + err);
		    console.log(err);
			return res.status(200).json({
				message: "Error creating user"});
		}
		else {

			console.log("New User Created Successfully...")
			return res.status(200).json({
				message: "User Created Successfully"});
		}
	} );
 } );


// route for showing all the users
app.use('/all', (req, res) => {
	console.log("Show all users");
	
	// find all the User objects in the database
	User.find( {}, (err, users) => {
		if (err) {
		    res.type('html').status(200);
		    console.log('uh oh' + err);
		    res.write(err);
		}
		else {
		    if (users.length == 0) {
				res.type('html').status(200);
				res.write('There are no users.');
				res.end();
				return;
		    }
		    // use EJS to show all the users
		    res.render('all', { users: users });

		}
		}).sort({ 'email': 'asc' }); // this sorts them BEFORE rendering the results

    });

// route for accessing data via the web api
// to use this, make a request for /api to get an array of all User objects
// or /api?username=[whatever] to get a single object
app.use('/search_user', (req, res) => {
	console.log("Searching for User:"+ req.query.email + "...");

	// construct the query object
	var queryObject = {};
	if (req.query.email) {
	    // if there's a email in the query parameter, use it here
		queryObject = { "email" : req.query.email };
	}
    
	User.find( queryObject, (err, users) => {
		if (err) {
		    console.log('uh oh' + err);
			return res.json({});
		}
		else if (users.length == 0) {
		    // no objects found, so send back empty json
			return res.json({});
		}
		
		else if (users.length > 0 ) {
			var user = users[0];
			var temp = { "email" : user.email , "password" : user.password , "name" : user.name , "school" : user.school, "bio" : user.bio,
			"rank" : user.rank, "points" : user.points, "phoneNumber" : user.phoneNumber };
			console.log(temp);

		    // send back a single JSON object
			return res.json( { "email" : user.email , "password" : user.password , "name" : user.name , "school" : user.school, "bio" : user.bio,
			"rank" : user.rank, "points" : user.points, "phoneNumber" : user.phoneNumber, "profilePic" : user.profilePic});
			
		}
		
	});
});

//route to update profile information for user
app.use('/update_profile', (req, res) => {
	var new_bio = req.body.bio;
	var new_phoneNumber = req.body.phoneNumber;
	var new_school = req.body.school;
	var new_profilePic = req.body.profilePic;

	console.log("Updating Profile of User:" + req.body.email + "...");
	console.log("Bomb Bio: " + new_bio);
	console.log("My Numba: " + new_phoneNumber);
	console.log("School: " + new_school);
	if (new_profilePic) {
		console.log("New Profile Pic Received...")
	}
	//console.log("Profile Pic:" + new_profilePic);
	// Find the User 
	var query = {};
	if (req.body.email) {
	    // if there's a email in the query parameter, use it here
		query = { "email" : req.body.email };
	}

	var updateProfile = { $set: {bio: new_bio, phoneNumber: new_phoneNumber, school: new_school, profilePic: new_profilePic} };

	User.updateOne( query, updateProfile, (err, users) => {
		if (err) {
		    res.type('html').status(200);
		    console.log('uh oh' + err);
			res.write(err);
			return res.json({
				message: "Error updating data"});
		}
		else {
			if (users.length == 0) {
				res.type('html').status(200);
				res.write('User does not exist');
				return res.status(200).json({
					message: "User not Found"});
			
			}
			console.log("Updated in database");
			return res.json({
				message: "User updated Successfully"});
		}
			
	});

});

app.use('/deleteUser', (req, res) => {
	var userToDelete = req.query.userToDelete;
	console.log("Deleting profile...");
	console.log("Profile being deleted: " + userToDelete);
		
	User.deleteOne({ "email" : userToDelete}, (err, results) => {
		if (err) {
			res.type('html').status(200);
			console.log('uh oh' + err);
			res.write(err);
			return res.status(200).json({
				message: "Error Deleting User"});
		} else {
			console.log("Successful deletion");
			return res.status(200).json({
				message: "User Deleted"});
		}
	});
});



/********************************* POST STUFF ****************************************/

// route for creating a new Post
// this is the action of the <createNewPost> button on the <New Post> Page
app.use('/createNewPost', (req, res) => {
	// construct the Post from the form data which is in the request body
	var newPost = new Post ({
		title: req.query.title,
		category: req.query.category,
		completed: req.query.completed,
		imgURL: req.query.imgURL,
		details: req.query.details,
		owner: req.query.owner
	});
		
	console.log("Creating new Post...");
	console.log(newPost._id);
	console.log(newPost.title);
	console.log(newPost.category);
	console.log(newPost.completed);
	console.log(newPost.imgURL);
	console.log(newPost.details);
	console.log(newPost.owner);
	

	// save the post to the database
	newPost.save( (err) => { 
		if (err) {
		    res.type('html').status(200);
		    res.write('uh oh: ' + err);
			console.log(err);
			return res.json({
				message: "Error Creating Post"});
		}
		else {
			console.log("New Post Created Successfully");
			return res.json({"_id": newPost._id});
		}
	});
});


// route for finding a specific Post by id
app.use('/getPost', (req, res) => {
	// construct the Post from the form data which is in the request body
	console.log("Getting Post by ID");
	
	// construct the query object
	var queryObject = {};
	if (req.query._id) {
	    // if there's a id in the query parameter, use it here
		queryObject = { "_id" : req.query._id };
	}
		
	console.log("Finding Post by ID...");
	
	Post.find( queryObject, (err, posts) => {
		console.log(posts);
		if (err) {
		    console.log('uh oh' + err);
			return res.json({});
		}
		else if (posts.length == 0) {
		    // no objects found, so send back empty json
			console.log("no posts");
			return res.json({});
		}
		
		else if (posts.length > 0 ) {
			var post = posts[0];

			console.log("title: " + post.title);
			console.log("category: " + post.category);
			console.log("completed: " + post.completed);
			console.log("details: " + post.details);
			console.log("owner: " + post.owner);

			//get owner's name
			User.find( {"email" : post.owner}, (err, users) => {
				if (err) {
					console.log('uh oh' + err);
				}
				else if (users.length == 0) {
					// no objects found, so send back empty json
				} else {
					user = users[0];
					console.log("owner_name: " + user.name);
					// send back a single JSON object
					return res.json( { "title" : post.title, 
									"category" : post.category, 
									"completed" : post.completed,
									"imgURL": post.imgURL,
									"details": post.details,
									"owner": post.owner ,
									"_id": post._id,
									"owner_name": user.name
									});
				}
			});
		}
		
	});

});


// route for all posts by single user
app.use('/findUserPosts', (req, res) => {
	// construct the Post from the form data which is in the request body
	console.log("Searching for User's Posts");
	
	// construct the query object
	var queryObject = {};
	if (req.query.owner) {
	    // if there's a email in the query parameter, use it here
		queryObject = { "owner" : req.query.owner };
	}
		
	console.log("Finding User's Posts...");
	
	Post.find( queryObject, (err, posts) => {
		console.log(posts);
		if (err) {
		    console.log('uh oh' + err);
			return res.json({});
		}
		else {
		    if (posts.length == 0) {
				res.type('html').status(200);
				res.write('There are no posts for this user yet.');
				return res.json({})
			}
			
			//otherwise return all posts

			//posts.forEach (post => 
			//	console.log("title: " + post.title));

			return res.json(posts);
		}
		
	});

});

//route to update post information
app.use('/updatePost', (req, res) => {
	var new_title = req.query.title;
	var new_category = req.query.category;
	var new_completed = req.query.completed;
	var new_imgURL = req.query.imgURL;
	var new_details = req.query.details;

	console.log("Updating Post...");

	console.log("New Title: " + new_title);
	console.log("New Categroy: " + new_category);
	console.log("New Completed: " + new_completed);
	console.log("New Details: " + new_details);

	// Find the post 
	var query = {};
	if (req.query._id) {
	    // if there's a email in the query parameter, use it here
		query = { "_id" : req.query._id };
	}

	var updatePost = { $set: {title: new_title, category: new_category, completed: new_completed, imgURL: new_imgURL, details: new_details} };

	Post.updateOne( query, updatePost, (err, posts) => {
		if (err) {
		    res.type('html').status(200);
		    console.log('uh oh' + err);
			res.write(err);
			return res.json({
				message: "Error updating post"});
		}
		else {
			if (posts.length == 0) {
				res.type('html').status(200);
				res.write('post does not exist');
				return res.status(200).json({
					message: "post not Found"});
			
			}
			console.log("Updated in database");
			return res.json({
				message: "Post updated Successfully"});
		}
			
	});

});


	
// route for showing all the posts
app.use('/allPosts', (req, res) => {
	console.log("Show all Posts");
	
	// find all the User objects in the database
	Post.find( {}, (err, posts) => {
		if (err) {
		    res.type('html').status(200);
		    console.log('uh oh' + err);
			res.write(err);
			res.end();
			return res.json({});;
		}
		else {
		    if (posts.length == 0) {
				res.type('html').status(200);
				res.write('There are no posts yet.');
				res.end();
				return res.json({});
		    }
		    // use EJS to show all the users
			//res.render('all_posts', { posts: posts });
			return res.json(posts);

		}
	})
});



/********************* WEB STUFF *******************/
app.get('/', (req, res) => {
	res.render('login_signup', {qs: req.query});
});

app.post('/', urlencodedParser, function(req, res){
	console.log(req.body.email);
	console.log(req.body.password);

	var bodyObject = {};

	if (req.body.email && req.body.password) {
	    // if there's a email in the query parameter, use it here
		bodyObject = { "email" : req.body.email, "password" : req.body.password };
	}
    
	User.find( bodyObject, (err, users) => {
		if (err) {
			console.log('uh oh' + err);
			res.end('Error');
			//return;
		}
		else if (users.length == 0) {
			console.log('Invalid User');
			res.end('Invalid User');
		    // no objects found, so send back empty json
			//return;
		}
		
		else if (users.length > 0 ) {
			var user = users[0];
			var temp = { "email" : user.email , "password" : user.password , "name" : user.name , "school" : user.school, "bio" : user.bio,
			"rank" : user.rank, "points" : user.points, "phoneNumber" : user.phoneNumber };
			console.log(temp);
			//res.redirect('/public/temp.html');
			res.render('temp', {data: user});

		}
		
	});
});

// app.post('/temp', urlencodedParser, function(req, res){
// //app.get('/temp', (req, res) => {
// 	console.log('temp:' + req.body.email);
// 	console.log('temp:' + req.body.password);
// 	res.render('temp', {qs: req.query});
// });



/*************************************************/
app.use('/public', express.static('public'));

//app.use('/', (req, res) => { res.redirect('/public/temp.html'); } );


app.listen(3000,  () => {
	console.log('Listening on port 3000');
});
