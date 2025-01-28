if (process.env.NODE_ENV != "production") {
    require('dotenv').config();    
}



const express = require("express");   // For express
const app = express();
const mongoose = require("mongoose");  // For mongoose
const path = require("path");   // For ejs
const methodOverride = require("method-override"); // For method-Override
const ejsMate = require("ejs-mate");  // For EjsMate
const ExpressError = require("./utils/ExpressError.js");  // for Error handling
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");   // for flash msg one time
const passport = require("passport");   // Authentigation
const LocalStrategy = require("passport-local");   // Authentigation
const User = require("./models/user.js");    // Authentigation



const listingRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");





app.set("view engine" , "ejs")    // For ejs
app.set("views" , path.join(__dirname , "views"));   // For ejs
app.use(express.urlencoded({extended: true})); // For encoded
app.use(methodOverride("_method"));  // For Method-Override
app.engine("ejs" , ejsMate);  // For EjsMate
app.use(express.static(path.join(__dirname , "/public"))); // For static file use like css files



// Creating mongodb (creating database)
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dburl = process.env.ATLASDB_URL;

main().then(()=>{
    console.log("Connected to DB");
    
}).catch((err)=>{
    console.log(err);
    
})

async function main() {
    await mongoose.connect(dburl) 
}


const store = MongoStore.create({
    mongoUrl: dburl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error" , () =>{
    console.log("ERROR in MONGO SESSION STORE" , err);
    
});



// express-session
const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge :  7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    },
};


// basic API
// app.get("/" , (req , res)=>{
//     res.send("Hi,I am root");  
// });


// user session // multiple tabs
app.use(session(sessionOptions));
app.use(flash());


//Authentigation
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// middleware for locals
app.use((req , res , next)=>{
    res.locals.success = req.flash("success"); 
    res.locals.error = req.flash("error"); 
    res.locals.currUser = req.user;
    next();
});


// // demo user Authentigation
// app.get("/demouser" , async(req , res)=>{
//     let fakeUser = new User({
//         email: "rakshit@gmail.com",
//         username: "rakshit113",
//     });

//     let registerUser = await User.register(fakeUser , "rakshit123");
//     res.send(registerUser);
// });




app.use("/listings" , listingRouter);
app.use("/listings/:id/reviews" , reviewsRouter);
app.use("/" , userRouter);



// creating information for database
//app.get("/testListing" , async(req , res)=>{
//    let sampleListing = new Listing({
//        title: "My new Villa",
//        description: "By the beach",
//        price: 1200,
//        location: "Calangute , Goa",
//        country: "India",
//    });
//
//    await sampleListing.save();
//    console.log("Sample was Saved");
//    res.send("successful testing");
//});


app.all("*" , (req , res , next)=>{
    next(new ExpressError(404 , "Page Not Found!"));
});


// Middleware (Error Handling)
app.use((err , req , res , next)=>{
    let{statusCode = 500 , message = "Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs" , {message});
    // res.status(statusCode).send(message);
});

// root port
app.listen(8080 , ()=>{
    console.log("server is listening to port 8080");   
});
