const userDatabase = require('../../model/user');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { block } = require('../../middleware/userControl');

//home
const home = (req, res) => {
    let loggedIn = false;
    if (req.session.user) {
        loggedIn = true;
    }
    res.render('user/home', { loggedIn });
};

//login
const userLogin = async (req, res) => {
    try {
        const successMessage = req.flash('success')[0]
        const errorMessage = req.flash('error')[0]
        if (req.session.user) {
            res.redirect('/');
        } else {
            res.render('user/userLogin', { successMessage: successMessage, errorMessage: errorMessage });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("error occured");
    }
};

const postLogin = async (req, res) => {
    try {
        const enteredEmail = req.body.email;
        const enteredPassword = req.body.password;
        const user = await userDatabase.findOne({ email: enteredEmail });

        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect('/userLogin');
        }

        if (user.blocked) {
            // Set the specific error message for a blocked user
            req.flash("error", "User is blocked. Please contact support for assistance.");
            return res.redirect('/userLogin');
        }

        const isPasswordValid = await bcrypt.compare(enteredPassword, user.password);
        if (isPasswordValid) {
            req.session.user = user;
            return res.redirect('/');
        } else {
            req.flash("error", "Invalid password.");
            return res.redirect('/userLogin');
        }
    } catch (error) {
        console.log(error);
        req.flash("error", "Error occurred during login.");
        return res.status(500).send("Error occurred");
    }
};



//logout
const userLogout = async (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
            res.send("error occured");
        } else {
            console.log("Logout successfull");
            res.status(200);
            res.redirect('/');
        }
    });
};

//user signup
const signup = (req, res) => {
    try {
        const errorMessage = req.flash('error')[0]; // Get the first error message
        const successMessage = req.flash('success')[0]
        if (req.session.user) {
            res.render('user/userSignup');
        } else {
            res.render('user/userSignup', { errorMessage ,successMessage});
        }
    } catch (error) {
        console.log("Error in getsignup", error);
        res.status(500).send("Error occured during getsignup");
    }
};

const postSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const checkEmail = await userDatabase.find({ email: email });
        if (checkEmail.length > 0) {
            req.flash("error", "User Already Exists..!");
            return res.redirect("/userSignup");
        } else {
            console.log('Generating OTP');
            const otp = generateotp();
            console.log('Generated OTP:', otp);


            req.session.userDetails = {
                username,
                email,
                password
            };

            req.session.otp = otp;
            req.session.expireTime = new Date(expireTIme);
            console.log("Redirecting to OTP page");

            req.flash("success", "Signup successful.");

            return res.redirect('/otp');
        }
    } catch (error) {
        console.log("Error in signup:", error);
        req.flash("error", "Error occurred during signup");
        return res.status(500).send("Error occurred during signup");
    }
};

//generating otp
let expireTIme;
const generateotp = () => {
    const now = new Date();
    expireTIme = new Date(now.getTime() + 1 * 60000);
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


///resend otp
const getResendOtp = async (req, res) => {
    try {
        if (!req.session.userDetails) {
            return res.redirect('/userSignup');
        }
        const username = req.session.userDetails.username; // Corrected to retrieve username
        console.log(username);
        const email = req.session.userDetails.email;

        const check = await userDatabase.find({ email });

        if (check.length > 0) {
            res.render('user/userSignup');
        } else {
            console.log('Generating OTP');
            const otp = generateotp();
            console.log('Generated OTP:', otp);


            req.session.otp = otp;
            req.session.expireTime = new Date(expireTIme);

            console.log("Redirecting to OTP page");
            return res.redirect('/otp');
        }


    } catch (error) {
        console.log("Error in getResendOtp:", error);
        req.flash("error", "Error occurred during resend OTP");
        return res.status(500).send("Error occurred during resend OTP");
    }
};

module.exports = {
    userLogin,
    postLogin,
    home,
    userLogout,
    signup,
    postSignup,
    getResendOtp
};
