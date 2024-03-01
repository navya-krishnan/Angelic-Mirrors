const isUser = (req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect('/user/userLogin')
    }
}

module.exports = {
    isUser
}