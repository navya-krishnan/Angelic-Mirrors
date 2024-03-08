const isUser = (req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect('/userLogin')
    }
}

module.exports = {
    isUser
}