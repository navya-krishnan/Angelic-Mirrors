const userDatabase = require('../../model/user');
const productDatabase = require('../../model/product');
const cartDatabase = require('../../model/cart');
const orderDatabase = require('../../model/order');
const addressDatabase = require('../../model/address')
const couponDatabase = require('../../model/coupon')
const Razorpay = require("razorpay");

//route for placing order
const getPlaceOrder = async (req, res) => {
    try {
        const { userId, productId, paymentMethod } = req.body;
        console.log(productId, "user");

        // Fetch coupon information here
        const coupon = await couponDatabase.findOne({ userId: userId });
        console.log(coupon, "coupon");

        // Extract discountAmount from the coupon if it exists
        const discountAmount = coupon ? coupon.discount_Amount : 0;

        const cart = await cartDatabase.findOne({ userId: userId }).populate("products.product");

        const productsInCart = cart.products.map((item => ({
            product: item.product._id,
            quantity: item.quantity,
            totalPrice: (item.quantity * item.product.product_price)
        })));

        const shippingAddress = await addressDatabase.findOne({ userId: userId });
        const orderDate = new Date();

        //inserting order
        const order = await orderDatabase.create({
            userId,
            products: productsInCart,
            shippingAddress: shippingAddress,
            orderDate: orderDate,
            paymentMethod: paymentMethod,
            discountAmount: discountAmount
        });

        console.log(order, "order");

        //adding coupon to user database
        if (req.query.couponId && req.query.couponId !== undefined) {
            console.log("Coupon ID:", req.query.couponId);
            try {
                const coupon = await userCollection.findByIdAndUpdate(userId, {
                    $push: { appliedCoupons: req.query.couponId }
                });
                if (!coupon) {
                    console.log("User not found or coupon not applied.");
                } else {
                    console.log("Coupon applied successfully.");
                }
            } catch (error) {
                console.error("Error applying coupon:", error);
            }
        }


        //removing purchased products from cart
        const updateCart = await cartDatabase.updateOne(
            { userId: userId },
            { $pull: { products: { product: { $in: productsInCart.map(product => product.product) } } } }
        )

        res.redirect('/orderConfirm')


    } catch (error) {
        console.log("Error in getOrderConfirm:", error);
        return res.status(500).send("Error occurred during get order place");
    }
}



// rendering order confirm page
const getOrderConfirm = async (req, res) => {
    try {
        if (req.session && req.session.user) {

            const loggedIn = true;
            const productId = req.body.productId
            const orders = await orderDatabase.findOne({ userId: req.session.user._id }).populate('products.product')


            const product = await productDatabase.findOne({ productId: productId })
            res.render('user/orderConfirm', { orders, loggedIn, product });
        } else {
            throw new Error("User session not found");
        }
    } catch (error) {
        console.log("Error in getOrderConfirm:", error);
        return res.status(500).send("Error occurred during get order confirmation page");
    }
};

//route for get myorder page
const getMyOrders = async (req, res) => {
    try {
        if (req.session.user) {
            const loggedIn = true;
            const user = req.session.user
            const userId = user._id

            const orders = await orderDatabase.find({ userId: userId }).populate("products.product")
            console.log(user, "user");

            // Calculate expected delivery date
            const deliveryDurationInDays = 7;
            const currentDate = new Date();
            const expectedDeliveryDate = new Date(currentDate.getTime() + deliveryDurationInDays * 24 * 60 * 60 * 1000);

            const orderId = req.params.id

            res.render('user/myOrders', { loggedIn, orders, expectedDeliveryDate, orderId })
        }
    } catch (error) {
        console.log("Error in getOrderConfirm:", error);
        return res.status(500).send("Error occurred during get my order page");
    }
}

//cancel order
const getCancelOrder = async (req, res) => {
    try {
        if (req.session.user) {
            const orderId = req.params.id;
            const updateOrder = await orderDatabase.findByIdAndUpdate(orderId,
                { $set: { status: "Cancelled" } });
            console.log(updateOrder, "update");
            res.redirect('/myOrders');
        } else {
            throw new Error("User session not found  for cancel");
        }
    } catch (error) {
        console.log("Error in postCancelOrder:", error);
        return res.status(500).send("Error occurred during cancel order");
    }
}

//return order
const postReturnOrder = async (req, res) => {
    try {
        if (req.session.user) {
            const orderId = req.params.id;
            const orderUpdate = await orderDatabase.findByIdAndUpdate(orderId,
                { $set: { status: "Returned" } })
            console.log(orderUpdate, "orderupdate");
            res.sendStatus(200);
        } else {
            throw new Error("User session not found for return");
        }
    } catch (error) {
        console.log("Error in postCancelOrder:", error);
        return res.status(500).send("Error occurred during return order");
    }
}

//order Details
const getOrderDetail = async (req, res) => {
    try {
        if (req.session && req.session.user && req.params.id) {
            const loggedIn = true;
            const orderId = req.params.id;
            const order = await orderDatabase.findById(orderId)
                .populate('products.product')
                .populate('shippingAddress');

            if (!order) {
                throw new Error("Order not found");
            }

            const cart = await cartDatabase.findOne({ userId: req.session.user._id });

            if (!cart) {
                throw new Error("Cart not found");
            }

            const cartQty = cart.products.length;

            res.render('user/orderDetail', {
                order,
                cartQty,
                loggedIn
            });
        } else {
            throw new Error("User session not found or order ID missing");
        }
    } catch (error) {
        console.log("Error in getOrderDetail:", error);
        return res.status(500).send("Error occurred during order detail: " + error.message);
    }
};

//razorpay payment
const postRazorpay = async (req, res) => {
    try {
        let total = req.body.totalPrice;

        // Create a new instance of Razorpay with your API keys
        let instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // Calculate total amount in paise (Indian currency)
        let totalAmountInPaise = Number(total) * 100;

        // Define options for creating a new order
        let options = {
            amount: totalAmountInPaise,
            currency: "INR",
            receipt: "receipt#",
            notes: {
                key1: "value3",
                key2: "value2",
            },
        };


        // Create a new order using Razorpay API
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.error("Error creating order:", err);
                return res.status(500).json({ error: "Error creating order", details: err });
            }

            console.log("Order created successfully:", order);
            res.status(200).json({ orderId: order.id });
        });
    } catch (error) {
        console.error("Error in postRazorpay:", error);
        res.status(500).json({ error: "Error while creating Razorpay payment", details: error });
    }
};

module.exports = {
    getOrderConfirm,
    getPlaceOrder,
    getMyOrders,
    getCancelOrder,
    postReturnOrder,
    getOrderDetail,
    postRazorpay
};
