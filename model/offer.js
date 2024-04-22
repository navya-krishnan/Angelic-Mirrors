const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    product_name: {
        type: mongoose.Schema.ObjectId,
        ref: 'productdb'
    },
    category_name: {
        type: mongoose.Schema.ObjectId,
        ref: 'categorydb'
    },
    discount_Amount: {
        type: Number
    },
    expiryDate: {
        type: Date,
        default: function () {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            return currentDate;
        },
        get: function (val) {
            return val ? new Date(val).toLocaleDateString('en-GB') : '';
        }
    },
    unlist: {
        type: Boolean,
        default: true
    }
})

const Offer = mongoose.model("offerdb", offerSchema)

module.exports = Offer 