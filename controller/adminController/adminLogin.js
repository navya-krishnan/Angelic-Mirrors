const adminDatabase = require('../../model/admin')



const getAdminLogin = (req,res)=>{
        res.render('admin/adminLogin')
}


module.exports = {
    getAdminLogin
}