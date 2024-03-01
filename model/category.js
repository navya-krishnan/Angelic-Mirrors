const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    
    category_name : {
        type : String,
        required : true
    },
    category_description : {
        type : String,
        required : true
    },
    blocked : {
        type : Boolean,
        default :true
    }
})

const category = new mongoose.model("categorydb",categorySchema)

module.exports = category