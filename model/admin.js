const mongoose = require('mongoose')

const adminLoginSchema = new mongoose.Schema({

    email :{
        type : String,
        required : true,
    },
    password :{
        type : String,
        required : true,
    },
    
})

// declaring the collection name
const adminLog = new mongoose.model("adminLogin",adminLoginSchema)

// exporting the module
module.exports = adminLog