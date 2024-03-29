const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Correct usage of mongoose.Schema
        ref: 'users',
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId, // Correct usage of mongoose.Schema
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

const Cart = mongoose.model("cartdb", cartSchema); // Naming convention updated to PascalCase

module.exports = Cart; // Updated export to use PascalCase
