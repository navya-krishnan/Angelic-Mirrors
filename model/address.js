const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Correct usage of mongoose.Schema
        ref: 'users',
        // required: true
    },
    name:{
        type: String,
        // required: true
    },
    address: {
        type: String,
        // required: true
    },
    street: {
        type: String,
        // required: true
    },
    city: {
        type: String,
        // required: true
    },
    district: {
        type: String,
        // required: true
    },
    state: {
        type: String,
        // required: true
    },
    country: {
        type: String,
        // required: true
    },
    pincode: {
        type: String,
        // required: true
    },
    phone: {
        type: String,
        // required: true
    }
})

const Address = mongoose.model('addressdb', addressSchema)
module.exports = Address