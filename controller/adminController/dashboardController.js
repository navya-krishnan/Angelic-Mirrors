const adminDatabase = require('../../model/admin')

//dashboard
const getDashboard = async(req,res)=>{
    try {
        if(req.session.admin){
            res.render('admin/adminDashboard')
        }else{
            res.render('admin/adminLogin')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

module.exports = {
    getDashboard
}