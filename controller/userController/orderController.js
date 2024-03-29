const userDatabase = require('../../model/user');
const productDatabase = require('../../model/product');
const cartDatabase = require('../../model/cart');
const orderDatabase = require('../../model/order');
const addressDatabase = require('../../model/address')
// const { Promise } = require('mongoose');

//route for placing order
const getPlaceOrder = async (req, res) => {
    try {
        const { userId, productId } = req.body
        console.log(productId, "user");
        const cart = await cartDatabase.findOne({ userId: userId }).populate("products.product");

        const productsInCart = cart.products.map((item => ({
            product: item.product._id,
            quantity: item.quantity,
            totalPrice: (item.quantity * item.product.product_price)
        })))

        const shippingAddress = await addressDatabase.findOne({ userId: userId });

        const orderDate = new Date();

        const order = await orderDatabase.create({
            userId,
            products: productsInCart,
            shippingAddress:shippingAddress,
            orderDate: orderDate 
        })
        console.log(order,"order");

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
            // console.log(order, "order");
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


            res.render('user/myOrders', { loggedIn, orders, expectedDeliveryDate })
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
            throw new Error("User session not found");
        }
    } catch (error) {
        console.log("Error in postCancelOrder:", error);
        return res.status(500).send("Error occurred during cancel order");
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

            // Calculate expected delivery date
            const deliveryDurationInDays = 7;
            const currentDate = new Date();
            const expectedDeliveryDate = new Date(currentDate.getTime() + deliveryDurationInDays * 24 * 60 * 60 * 1000);


            res.render('user/orderDetail', {
                order,
                cartQty,
                loggedIn,
                expectedDeliveryDate
            });
        } else {
            throw new Error("User session not found or order ID missing");
        }
    } catch (error) {
        console.log("Error in getOrderDetail:", error);
        return res.status(500).send("Error occurred during order detail: " + error.message);
    }
};





module.exports = {
    getOrderConfirm,
    getPlaceOrder,
    getMyOrders,
    getCancelOrder,
    getOrderDetail
};
