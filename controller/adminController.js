const app = require('express')

const credential={
    email:"navyanaveen@gmail.com",
    password:"naveen"
};

const getAdminLogin = (req,res)=>{
        res.render('adminLogin')
}

const postAdminLogin = (req,res)=>{
    res.redirect('/adminDashboard')
}


module.exports = {
    getAdminLogin,
    postAdminLogin
}