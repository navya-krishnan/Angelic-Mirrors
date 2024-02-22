const adminDatabase = require('../../model/admin')

//dashboard
const getDashboard = async(req,res)=>{
    try {
        if(!req.session.isAdminLoggedIn){
            console.log('gfhg');
            res.redirect('/admin')
        }else{
            console.log('vcvb');
            res.render('admin/adminDashboard')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

module.exports = {
    getDashboard
}