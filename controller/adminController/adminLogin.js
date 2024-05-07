const adminDatabase = require('../../model/admin')
const bcrypt = require('bcrypt')
// const { getDashboard } = require('./dashboardController');

//login
const getAdminLogin = (req, res) => {
    res.render('admin/adminLogin')
}

const postAdminLogin = async (req, res) => {
    try {
        const enteredEmail = req.body.email;
        const enteredPassword = req.body.password;
        a = await adminDatabase.find()
        console.log(a);
        const admin = await adminDatabase.findOne({ email: enteredEmail })
        if (admin) {
            console.log(admin.password, enteredPassword);
            if (enteredPassword === admin.password) {
                console.log("Admin Login Successful");
                req.session.admin = enteredEmail

                // Fetch top selling products details
                // const topSellingProductsDetails = await getDashboard(req, res);
                // const topSellingCategoriesDetails = await getDashboard(req,res)

                // Render admin dashboard with top selling products
                res.redirect('admin/adminDashboard');
            } else {
                console.log("Invalid Password")
                res.redirect('/admin')
            }
        } else {
            console.log(456);
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

//logout
const adminLogout = (req, res) => {
    req.session.admin = null
    console.log('admin session destroyed')
    res.redirect('/admin')
}


module.exports = {
    getAdminLogin,
    postAdminLogin,
    adminLogout
}