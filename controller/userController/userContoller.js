const userDatabase =  require('../../model/mongodb')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')

//home
const home = (req,res)=>{
    res.render('user/home')
}

//login
const userLogin = async(req,res)=>{
    try {
        if(req.session.user){
            res.redirect('user/home')
        }
        res.render('user/userLogin')
    } catch (error) {
        console.log(error);
        res.status(500).send("error occured")
    }
}
console.log("gsdhgdsm");
const postLogin = async(req,res)=>{
    console.log("hgh");
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
             res.redirect('user/home');
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


const userLogout = async(req,res)=>{
    req.session.destroy(function(err){
        if(err){
            console.log(err);
            res.send("error occured")
        }else{
            console.log("Logout successfull");
            res.status(200)
            res.redirect('/user/home')
        }
    })
}

//user signup
const signup = (req,res)=>{
    if(req.session.user){
        res.render('user/userSignup')
    }else{
        const errorMessage = req.session.errorMessage;
        req.session.errorMessage = null; // Clear the error message
        res.render('user/userSignup', { errorMessage });
    }
}

const postSignup = async (req, res) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

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
const generateotp = ()=>{
    const now = new Date();
    expireTIme = new Date(now.getTime()+1*60000)
    return Math.floor(100000 + Math.random()*900000).toString();
};

const transporter = nodemailer.createTransport({
    service : "Gmail",
    auth : {
        user : "knavya941@gmail.com",
        pass : "rmfz wobs bwdn ncuj"
    }
});


module.exports = {
    userLogin,
    postLogin,
    home,
    userLogout,
    signup,
    postSignup
}