const mongoose = require('mongoose')
const Schema = mongoose

const productSchema = new mongoose.Schema({
    product_name : {
        type : String,
        required : true,
        unique: true
    },
    product_category : {
        type : Schema.Types.ObjectId,
        ref : 'categorydb',
        required : true
    },
    product_price : {
        type : Number,
        required : true
    },
    product_stock : {
        type : Number,
        required : true
    },
    product_image : {
        type : [String],
        required : true
    },
    unlist : {
        type : Boolean,
        default : true
    }
})

const product = new mongoose.model("productdb",productSchema)

module.exports = product