const userDatabase = require('../../model/mongodb')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')

//home
const home = (req, res) => {
    let loggedIn = false
    if (req.session.user) {
        loggedIn = true
    }
    res.render('user/home', { loggedIn })
}

//login
const userLogin = async (req, res) => {
    try {
        if (req.session.user) {
            res.redirect('/')
        }
        res.render('user/userLogin')
    } catch (error) {
        console.log(error);
        res.status(500).send("error occured")
    }
}

const postLogin = async (req, res) => {
    try {
        console.log(req.body);
        const enteredEmail = req.body.email;
        const enteredPassword = req.body.password;
        const user = await userDatabase.findOne({ email: enteredEmail });
        if (user) {
            const isPasswordValid = await bcrypt.compare(enteredPassword, user.password);
            if (isPasswordValid) {
                console.log("Login successful");
                req.session.user = user
                res.redirect('/')
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

//logout
const userLogout = async (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
            res.send("error occured")
        } else {
            console.log("Logout successfull");
            res.status(200)
            res.redirect('/')
        }
    })
}

//user signup
const signup = (req, res) => {
    if (req.session.user) {
        res.render('user/userSignup')
    } else {
        const errorMessage = req.session.errorMessage;
        req.session.errorMessage = null; // Clear the error message
        res.render('user/userSignup', { errorMessage });
    }
}

const postSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body;


        const checkEmail = await userDatabase.find({ email: email });
        if (checkEmail.length > 0) {
            console.log('User already exists');
            req.flash("error", "User Already Exists..!");
            return res.redirect("/userSignup");
        } else {
            console.log('Generating OTP');
            const otp = generateotp();
            console.log('Generated OTP:', otp);

            const text = `Hello ${username}... This mail is from Angelic Mirrors... Enter the otp ${otp} to confirm your mail id...`;

            const mailOption = {
                from: "knavya941@gmail.com",
                to: email,
                subject: "OTP Verification",
                text: text
            };

            transporter.sendMail(mailOption, async (error, info) => {
                if (error) {
                    console.log("Error while sending OTP:", error);
                    req.flash("error", "Error while sending otp..! Try Again..!");
                    return res.redirect('/userSignup');
                } else {
                    console.log("OTP sent:", info.response);
                    req.session.userDetails = {
                        username,
                        email,
                        password
                    };

                    console.log('OTP:', otp);
                    req.session.otp = otp;
                    req.session.expireTime = new Date(expireTIme);
                    console.log("Redirecting to OTP page");
                    return res.redirect('/otp');
                }
            });
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
    expireTIme = new Date(now.getTime() + 1 * 60000)
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

            const text = `Hello ${username}... This mail is from Angelic Mirrors... Enter the otp ${otp} to confirm your mail id...`;

            const mailOption = {
                from: "knavya941@gmail.com",
                to: email,
                subject: "OTP Verification",
                text: text
            };

            transporter.sendMail(mailOption, async (error, info) => {
                if (error) {
                    console.log("Error while sending OTP:", error);
                    req.flash("error", "Error while sending otp..! Try Again..!");
                    return res.redirect('/user/otp');
                } else {
                    console.log("OTP sent:", info.response);
                    console.log('OTP:', otp);

                    req.session.otp = otp;
                    req.session.expireTime = new Date(expireTIme);

                    console.log("Redirecting to OTP page");
                    return res.redirect('/otp');
                }
            });
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
}