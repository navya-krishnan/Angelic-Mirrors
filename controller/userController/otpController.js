const userDatabase =  require('../../model/mongodb')
const bcrypt = require('bcrypt')

//signup otp
const getsignupOtp = async(req,res)=>{
    try {
        res.render('user/otp',{expireTime:req.session.expireTime})
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
            req.flash("error", "Otp is not correct or expired");
            res.redirect('/user/otp');
        }
    } catch (error) {
        console.log("Error in postSignupOtp:", error);
        res.status(500).send("Error rendering otp");
    }
};



module.exports = {
    getsignupOtp,
    postSignupOtp
}