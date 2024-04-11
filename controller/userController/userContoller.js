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
            res.render('user/userLogin', { successMessage: successMessage, errorMessage: errorMessage});
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

        const user = await userDatabase.findOne({ email: enteredEmail, });

        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect('/userLogin');
        }

        if(user.blocked){
            console.log("user is blocked");
            req.flash("error", "User is blocked. Please contact support for assistance.");
            return res.redirect('/userLogin');
        }

        // Compare passwords without converting to lowercase
        const isPasswordValid = await bcrypt.compare(enteredPassword, user.password);

        if (isPasswordValid) {
            req.session.user = user;
            console.log("Login successfull");
            return res.redirect('/');

        } else{
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
            res.render('user/userSignup', { errorMessage, successMessage });
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
            const otp = generateOTP();
            console.log('Generated OTP:', otp);

           await sendOTPByEmail(email, otp);

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
const generateOTP = () => {
    const now = new Date();
    expireTIme = new Date(now.getTime() + 1 * 60000);
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPByEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Signup',
            text: `Your OTP for signup is: ${otp}`
        };

        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully.');
    } catch (error) {
        console.log('Error sending OTP email:', error);
        throw error;
    }
};


///resend otp
const getResendOtp = async (req, res) => {
    try {
        if (!req.session.userDetails) {
            return res.redirect('/userSignup');
        }

        const { email } = req.session.userDetails;

        // Generate a new OTP
        const otp = generateOTP();
        console.log(otp,"resend otp");

        // Send OTP via email
        await sendOTPByEmail(email, otp);

        // Update session with new OTP and expiration time
        req.session.otp = otp;
        req.session.expireTime = new Date(Date.now() + 5 * 60000); // 5 minutes expiry

        console.log("Redirecting to OTP page");
        return res.redirect('/otp');

    } catch (error) {
        console.log("Error in getResendOtp:", error);
        req.flash("error", "Error occurred during resend OTP");
        return res.status(500).send("Error occurred during resend OTP");
    }
};

//forgot password
const getForgotPassword = async (req, res) => {
    try {
        res.render('user/forgotPassword', { expireTime: req.session.expireTime })
    } catch (error) {
        console.log("Error in getResendOtp:", error);
        return res.status(500).send("Error occurred during getting forgot password");
    }
}

const postForgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        // console.log(email,"email");


        if (!email) {
            return res.status(400).send("Email is missing.");
        }

        // Store the email in session for later use
        req.session.email = email;

        const user = await userDatabase.findOne({ email: email });

        if (user) {
            const otp = generateOTP();
            console.log("otp:", otp);

            const emailText = `Hello ${email}, this is from Angelic Mirrors. Your OTP is: ${otp}`;

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP for forgot password',
                text: emailText
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("Error sending OTP for forgot password");
                    res.render('user/forgotPassword');
                } else {
                    console.log("OTP sent: ", otp);
                    req.session.otp = otp;
                    req.session.expireTime = new Date(expireTIme);
                    res.redirect('/forgotOtp');
                }
            });
        } else {
            res.redirect('/user/userLogin');
        }
    } catch (error) {
        console.log("Error in postForgotPassword:", error);
        return res.status(500).send("Error occurred during posting forgot password");
    }
};

//to resend otp for forgot password
const getForgotResendOtp = async (req, res) => {
    try {
        const email = req.body.email;
        console.log(email, "email");
    } catch (error) {
        console.log("Error in getResendOtp:", error);
        req.flash("error", "Error occurred during resend OTP");
        return res.status(500).send("Error occurred during forgot resend OTP");
    }
}


//to get the new password page
const getNewPassword = async (req, res) => {
    try {
        res.render('user/newPassword')
    } catch (error) {
        console.log("Error in getResendOtp:", error);
        return res.status(500).send("Error occurred during get new password");
    }
}

const postNewPassword = async (req, res) => {
    try {
        // Extract email and new password from request
        let newPassword = req.body.password;
        const email = req.session.email;



        // Ensure newPassword is a string
        if (typeof newPassword !== 'string') {
            newPassword = String(newPassword); // Convert to string if not already
        }

        // Hash the newPassword with bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds).catch(error => {
            console.error("Error hashing password:", error);
            throw error;
        });

        const user = await userDatabase.findOne({ email });

        await userDatabase.findOneAndUpdate({ email: email }, { password: hashedPassword })
        console.log("Password updated successfully.");

        // Redirect to login page
        return res.redirect('/userLogin');
    } catch (error) {
        console.log("Error in postNewPassword:", error);
        return res.status(500).send("Error occurred during post new password");
    }
};



module.exports = {
    userLogin,
    postLogin,
    home,
    userLogout,
    signup,
    postSignup,
    getResendOtp,
    getForgotPassword,
    postForgotPassword,
    getNewPassword,
    postNewPassword,
    getForgotResendOtp
};
