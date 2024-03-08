const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({

    category_name: {
        type: String,
        required: true,
        unique: true
    },
    category_description: {
        type: String,
        required: true
    },
    blocked: {
        type: Boolean,
        default: true
    },
    hidden: {
        type: Boolean,
        default: false
    }
})

const category = new mongoose.model("categorydb", categorySchema)

module.exports = category