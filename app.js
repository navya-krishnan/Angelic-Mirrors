const express = require("express")
const app = express()
const path = require('path')
const mongoose = require("mongoose")
const nocache = require('nocache')
const session = require('express-session')
const adminRouter = require('./routes/adminRoutes')
const userRouter = require('./routes/userRoutes')
const angelicMirror = require("./model/user")
const adminLog = require('./model/admin')
const flash = require('connect-flash');
const multer = require('multer')
require('dotenv').config();


// Set up session middleware
const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
    console.error("SECRET_KEY is missing in the environment variables.");
    process.exit(1);
}

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
}));

app.use(flash());



// Connecting to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/angelicMirror")
    .then(() => {
        console.log("MongoDB is connected properly");
    }).catch((err) => {
        console.error("MongoDB connection error:", err);
    });


// Parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use(nocache())

// setting the view engines
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static('public'))

app.use('/admin', adminRouter)
app.use('/', userRouter)

app.listen(3000, () => {
    console.log("Connected")
})

