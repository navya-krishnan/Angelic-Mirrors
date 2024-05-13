const cartDatabase = require('../../model/cart');
const addressDatabase = require('../../model/address');
const couponDatabase = require('../../model/coupon');
const userDatabase = require('../../model/user')
const offerCollection = require('../../model/offer')

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

            // Retrieve the relevant product information
            const products = cart.products.map(item => item.product);
            
            const coupon = await couponDatabase.find();

            // Retrieve category offers
            const categoryOffers = await offerCollection.find({ category_name: { $exists: true } });

            const productOffers = await offerCollection.find({ product_name: { $exists: true } });

            // Initialize discount variables
            let discountPercentage = 0;

            // Loop through each product in the cart
            for (const product of products) {
                let productDiscountPercentage = 0;
                let productDiscountAmount = 0;

                // Check for matching category and product offers
                const matchingCategoryOffer = categoryOffers.find(offer => product.product_category && offer.category_name && product.product_category._id.equals(offer.category_name));
                const matchingProductOffer = productOffers.find(offer => product._id && offer.product_name && product._id.equals(offer.product_name));

                // Determine the highest discount
                if (matchingCategoryOffer) {
                    productDiscountPercentage = matchingCategoryOffer.discount_Amount;
                }
                if (matchingProductOffer && matchingProductOffer.discount_Amount > productDiscountPercentage) {
                    productDiscountPercentage = matchingProductOffer.discount_Amount;
                }

                // Calculate offer price and discount amount for the product
                product.offerPrice = productDiscountPercentage > 0 ? product.product_price - (product.product_price * (productDiscountPercentage / 100)) : null;
                product.discountPercentage = productDiscountPercentage;
                productDiscountAmount = product.product_price - product.offerPrice;
                product.discount_Amount = productDiscountAmount;

                // Accumulate discount for all products
                if (productDiscountPercentage > discountPercentage) {
                    discountPercentage = productDiscountPercentage;
                }
            }

            // Pass the data to the template
            res.render('user/checkout', {
                address: address ? address.address : null,
                user,
                cart,
                addresses,
                cartQuantity,
                loggedIn,
                products,
                userId,
                coupon,
                discountPercentage
            });
        } else {
            res.redirect('/userLogin');
        }
    } catch (error) {
        console.log("Error in getCheckout:", error);
        return res.status(500).send("Error occurred during get checkout page");
    }
};


//coupon apply
const postCouponApply = async (req, res) => {
    try {
        const userSession = req.session.user;
        const userId = userSession._id;

        const couponCode = req.body.couponCode;
        const cartTotal = req.body.cartTotal;

        if (cartTotal == null) {
            // If cartTotal is null or undefined, return an error response
            console.log("Cart total is missing in the request");
            return res.status(400).send({
                message: "Cart total is missing in the request",
                discountAmount: 0,
                total: 0, // Provide a default value for total
            });
        }

        const coupon = await couponDatabase.findOne({ coupon_Code: couponCode });

        if (!coupon) {
            // If the coupon is not found, return an error response
            console.log("No coupon available");
            return res.status(400).send({
                message: "Coupon not found",
                discountAmount: 0,
                total: cartTotal.toFixed(2), // Ensure to provide a valid total
            });
        }

        const couponId = coupon._id;
        console.log(couponId, "couponid");

        // Check if the coupon is already applied to the user
        const user = await userDatabase.findById(userId);

        if (user.couponApplied.includes(couponId)) {
            console.log("Coupon already applied");
            // If the coupon is already applied, return an error response
            return res.status(400).send({
                message: "Coupon already applied",
                discountAmount: 0,
                total: cartTotal.toFixed(2),
            });
        }

        // Check if the cart total meets the minimum amount required for the coupon
        if (coupon.minimum_Amount > cartTotal || coupon.maximum_Amount < cartTotal) {
            console.log("Cannot apply coupon");
            return res.status(400).send({
                message: "Cannot apply coupon",
                discountAmount: 0,
                total: cartTotal.toFixed(2),
            });
        }

        // Calculate discount amount and update user's coupon information
        const discountAmount = coupon.discount_Amount;
        const total = cartTotal - discountAmount;

        // Update user's coupon information
        await userDatabase.updateOne(
            { _id: userId },
            { $push: { couponApplied: couponId } }
        );

        console.log("Coupon applied");

        // Return success response with discount amount and total
        return res.send({
            discountAmount: discountAmount.toFixed(2),
            total: total.toFixed(2),
            couponId: couponId,
        });

    } catch (error) {
        console.log("Error in postCouponApply:", error);
        return res.status(500).send("Error occurred during post coupon apply");
    }
}

// removing applied coupon
const postRemoveCoupon = async (req, res) => {
    try {
        const userSession = req.session.user
        const userId = userSession._id

        const remove = await userDatabase.findByIdAndUpdate(userId, {
            couponApplied: []
        });

        console.log(remove, "remove");

        console.log("Coupon removed successfully");

        return res.send({ message: "Coupon removed successfully" });

    } catch (error) {
        console.log("Error in postRemoveCoupon:", error);
        return res.status(500).send("Error occurred during post Remove Coupon");
    }
}

module.exports = {
    getCheckout,
    postCouponApply,
    postRemoveCoupon
};
