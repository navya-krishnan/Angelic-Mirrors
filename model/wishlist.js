const mongoose = require('mongoose')

const wishlistSchema  = new mongoose.Schema({
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
        }
    }]
})

const wishlist = mongoose.model('wishlistdb',wishlistSchema)

module.exports = wishlist