const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productdb',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    cartTotal: {
        type: Number,
        default: 0
    }
});

const Cart = mongoose.model("cartdb", cartSchema); 

module.exports = Cart; 
