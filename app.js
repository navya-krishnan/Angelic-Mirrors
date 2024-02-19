const express = require("express")
const app = express()
const bodyParser  = require('body-parser')
const path = require('path')
const mongoose = require("mongoose")
const nocache = require('nocache')
const session = require('express-session')
const adminRouter = require('./routes/adminRoutes')
const userRouter = require('./routes/userRoutes')
const angelicMirror = require("./model/mongodb")
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
    saveUninitialized: true
 }));


// connecting the mongodb server
mongoose.connect("mongodb://127.0.0.1:27017/angelicMirror")
.then(()=>{
    console.log("Mongodb is connected properly");
}).catch(()=>{
    console.log("Mongodb is not connected properly");
})

// Parsing
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}));

app.use(nocache())

// setting the view engines
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.static('public'))

app.use('/',adminRouter)
app.use('/',userRouter)

app.listen(5000,()=>{
    console.log("Connected")
})