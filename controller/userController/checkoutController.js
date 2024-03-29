const cartDatabase = require('../../model/cart');
const addressDatabase = require('../../model/address');

const getCheckout = async (req, res) => {
    try {
        const loggedIn = req.session.user ? true : false;
        if (req.session.user) {
            const user = req.session.user;
            const userId = user._id;

            const address = await addressDatabase.find({ userId: userId }).populate('address');

            const cart = await cartDatabase.findOne({ userId: userId }).populate("products.product");

            const cartQuantity = cart.products.length;

            const addresses = await addressDatabase.find({ userId: userId });

            const productId = cart.products[0].product._id;

            // Pass the data to the template
            res.render('user/checkout', {
                address: address ? address.address : null,
                user,
                cart,
                addresses,
                cartQuantity,
                loggedIn,
                productId,
                userId
            });
        } else {
            res.redirect('/userLogin');
        }
    } catch (error) {
        console.log("Error in getCheckout:", error);
        return res.status(500).send("Error occurred during get checkout page");
    }
};

module.exports = {
    getCheckout
};
