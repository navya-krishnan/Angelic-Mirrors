const app = require('express')
const userDatabase =  require('../model/mongodb')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const bcrypt = require('bcrypt')


//nodemailer set up
// Create a Nodemailer transporter object
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Change to your email service provider
    auth: {
        user: 'knavya941@gmail.com', // Your email address
        pass: 'navyanavya' // Your email password or application-specific password
    }
});



//login
const userLogin = (req,res)=>{
    res.render('shop')
}

const postLogin = async(req,res)=>{
    try {
     console.log(req.body);
     const enteredEmail = req.body.email;
     const enteredPassword = req.body.password;
     const user = await userDatabase.findOne({ email: enteredEmail });
     if (user) {
         const isPasswordValid = await bcrypt.compare(enteredPassword, user.password);
         if (isPasswordValid) {
             console.log("Login successful");
             // Here you might want to set some session variables to indicate the user is logged in
             res.redirect('/home');
         } else {
             console.log("Invalid password");
             res.redirect('/');
         }
     } else {
         console.log("User not found");
         res.redirect('/');
     }
    } catch (error) {
         console.log(error);
         res.status(500).send("Error occurred");
    } 
 }
 

//home
const home = async(req,res)=>{
    if(req.session.user){
        let user = await userDatabase.findOne({email:enteredEmail})
        if(user){
            res.render('home')
        }else{
            res.redirect('/userLogin')
        }
    }
}

const userLogout = async(req,res)=>{
    req.session.destroy(function(err){
        if(err){
            console.log(err);
            res.send("error occured")
        }else{
            console.log("Logout successfull");
            res.status(200)
            res.redirect('/')
        }
    })
}


// Send forgot password email
function sendResetEmail(email, resetToken) {
    // Define email options
    const mailOptions = {
        from: 'knavya941@gmail.com', // Sender address (your email address)
        to: email, // Recipient's email address
        subject: 'Reset Your Password', // Subject line
        text: `To reset your password, click on the following link: http://yourwebsite.com/reset-password?token=${resetToken}` // Plain text body
        // You can also use HTML body if you prefer
        // html: `<p>To reset your password, click on the following link: <a href="http://yourwebsite.com/reset-password?token=${resetToken}">Reset Password</a></p>`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending forgot password email:', error);
        } else {
            console.log('Forgot password email sent:', info.response);
        }
    });
}


//user signup
const signup = (req,res)=>{
    if(req.session.user){
        res.render('userSignup')
    }else{
        const errorMessage = req.session.errorMessage;
        req.session.errorMessage = null; // Clear the error message
        res.render('userSignup', { errorMessage });
    }
}

const postSignup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            req.session.errorMessage = "Email and password are required";
            return res.redirect('/userSignup');
        }

        // Number of rounds for hashing
        const saltRounds = 10;

        console.log('Received password:', password);
        console.log('Salt rounds:', saltRounds);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        console.log('Hashed password:', hashedPassword);

        const details = {
            email: email,
            password: hashedPassword,
            name: name
        };

        // Check if user already exists
        const existingUser = await userDatabase.findOne({ email: email });

        if (existingUser) {
            console.log("User already exists");
            req.session.errorMessage = "User already exists";
            return res.redirect('/userSignup');
        } else {
            await userDatabase.insertMany(details);
            req.session.succesMessage = "Signup Successful"
            res.redirect('/');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error occurred');
    }
};

//forgot password
const forgot = async(req,res)=>{
    res.render("forgotPassword")
}

const postForgotPassword = async (req, res) => {
    try {
        const enteredEmail = req.body.email;
        const user = await userDatabase.findOne({ email: enteredEmail });

        if (user) {
            // Generate and store a unique token for this password reset request
            const resetToken = await generateResetToken(user._id); // You need to implement this function

            // Send an email to the user with the reset link containing the token
            sendResetEmail(user.email, resetToken); // You need to implement this function

            res.render('forgotPasswordSuccess'); // Render a success message
        } else {
            res.render('forgototp', { error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred');
    }
}

//shop



module.exports = {
    userLogin,
    postLogin,
    home,
    userLogout,
    forgot,
    postForgotPassword,
    signup,
    postSignup
}