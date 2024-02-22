const userDatabase =  require('../../model/mongodb')

//get user
const getUserManage =async(req,res)=>{
    try {
        if(req.session.admin){
    

            const users = await userDatabase.find()

            res.render('admin/userManagement',{users})
         
        }else{
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

//block user
const getBlockUser = async(req,res)=>{
    try {
        const users = await userDatabase.findOne({email : req.query.email})
        const blocked = users.block;
        if(blocked){
            await userDatabase.updateOne(
                {email : req.query.email},
                {$set : {block : false}}
            )
        }else{
            await userDatabase.updateOne(
                {email : req.query.email},
                {$set : {block : true}}
            )
        }
        res.redirect('/admin/userManagement')
    } catch (error) {
        
    }
}

module.exports =  {
    getUserManage,
    getBlockUser
}