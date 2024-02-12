const app = require('express')
const userDatabase =  require('../model/mongodb')

//login
const userLogin = (req,res)=>{
    res.render('userLogin')
}

const postLogin = async(req,res)=>{
   try {
    console.log(req.body,'boooooo');
    const enteredEmail = req.body.email
    const enteredPassword = req.body.password
    const user = await userDatabase.findOne({email:enteredEmail})
    if(user && enteredEmail && enteredPassword){
        console.log("Login successfull");
        res.render('home')
    }else{
        console.log("Invalid");
        res.redirect('/userLogin')
    }
   } catch (error) {
        console.log(error);
        res.status(500).send("Error occured")
   } 
}


//home
const home = async(req,res)=>{
    if(req.session.user){
        let user = await userDatabase.findOne({email:enteredEmail})
        if(user){
            res.render('home')
        }else{
            res.redirect('/login')
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

module.exports = {
    userLogin,
    postLogin,
    home,
    userLogout
}


