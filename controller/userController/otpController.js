const userDatabase = require('../../model/user')
const bcrypt = require('bcrypt')

//signup otp
const getsignupOtp = async (req, res) => {
    try {
        const errorMessage = req.flash('errors')[0]
        res.render('user/otp', { expireTime: req.session.expireTime, errorMessage })
    } catch (error) {
        console.log(error);
        res.status(500).send("Error rendering otp");
    }
}

const postSignupOtp = async (req, res) => {
    try {
        const { digit1, digit2, digit3, digit4, digit5, digit6 } = req.body;

        // Concatenate OTP digits as strings
        const enteredOtp = `${digit1 || ''}${digit2 || ''}${digit3 || ''}${digit4 || ''}${digit5 || ''}${digit6 || ''}`;

        const storeOtp = req.session.otp;
        const expireTime = req.session.expireTime;

        console.log("Entered OTP:", enteredOtp);
        console.log("Stored OTP:", storeOtp);

        if (enteredOtp === storeOtp && new Date() <= new Date(expireTime)) {
            console.log('Correct OTP entered');
            req.flash("error", null);
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hashSync(
                req.session.userDetails.password,
                saltRounds
            );

            console.log("User details:", req.session.userDetails);
            const newUser = new userDatabase({
                username: req.session.userDetails.username,
                email: req.session.userDetails.email,
                password: hashedPassword
            });

            await newUser.save();
            console.log("User added successfully..!");
            res.redirect('/userLogin');
        } else {

            console.log('Invalid OTP or OTP expired');
            req.flash("errors", "Otp is not correct or expired");
            res.redirect('/otp');
        }
    } catch (error) {
        console.log("Error in postSignupOtp:", error);
        res.status(500).send("Error rendering otp");
    }
};


//forgot otp
const getForgotOtp = async (req, res) => {
    try {
        res.render('user/forgotOtp')
    } catch (error) {
        console.log("Error in postSignupOtp:", error);
        res.status(500).send("Error rendering get forgot otp");
    }
}


const postForgotOtp = async (req, res) => {
    try {
        const { digit1, digit2, digit3, digit4, digit5, digit6 } = req.body;

        // Concatenate OTP digits as strings
        const enteredOtp = `${digit1 || ''}${digit2 || ''}${digit3 || ''}${digit4 || ''}${digit5 || ''}${digit6 || ''}`;

        // Retrieve stored OTP and expiration time from session
        const storeOtp = req.session.otp;
        const expireTime = req.session.expireTime;

        console.log("Entered for OTP:", enteredOtp);
        console.log("Stored for OTP:", storeOtp);

        // Check if entered OTP matches stored OTP and if it's not expired
        if (storeOtp !== enteredOtp || new Date() > new Date(expireTime)) {
            console.log('Invalid OTP or OTP expired');
            res.render('user/forgotOtp');
        } else {
            console.log('Correct OTP entered');
            res.redirect('/newPassword');
        }

    } catch (error) {
        console.log("Error in postForgotOtp:", error);
        res.status(500).send("Error rendering post forgot OTP page");
    }
};



module.exports = {
    getsignupOtp,
    postSignupOtp,
    getForgotOtp,
    postForgotOtp
}