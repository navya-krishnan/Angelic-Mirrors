const adminDatabase = require('../../model/admin')
const bcrypt = require('bcrypt')

//login
const getAdminLogin = (req,res)=>{
        res.render('admin/orderManagement')
}

// const postAdminLogin = async(req,res)=>{
//     try {
//         const enteredEmail = req.body.email;
//         const enteredPassword = req.body.password;

//         const admin = await adminDatabase.findOne({email : enteredEmail})
//         if(admin){
//             const validPassword = await bcrypt.compare(enteredPassword,admin.password)
//             if(validPassword){
//                 console.log("Admin Login Successful");
//                 res.redirect('admin/adminDashboard')
//             }else{
//                 console.log("Invalid Password")
//                 res.redirect('admin/adminLogin')
//             }
//         }
//     } catch (error) {
//         console.log(error);
//         res.status(500).send("Error occurred");
//     }
// }

module.exports = {
    getAdminLogin
    // postAdminLogin
}