const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "users",
        required: true
    },
    products: [
        {
            product: {
                type: mongoose.Schema.ObjectId,
                ref: "productdb",
                required: true
            },
            quantity: {
                type: Number
            },
            totalPrice: {
                type: Number
            }
        }
    ],
    shippingAddress: {
        type: mongoose.Schema.ObjectId,
        ref: 'addressdb',
    },
    paymentMethod: {
        type: String,
        default: "COD"
    },
    discountAmount:{
        type : Number
    },
    status: {
        type: String,
        default: "Pending"
    },
    orderDate: {
        type: Date,
        default: Date.now(),
    }
})

const Order = mongoose.model('orderdb', orderSchema)

module.exports = Order