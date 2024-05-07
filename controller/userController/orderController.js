const userDatabase = require('../../model/user');
const productDatabase = require('../../model/product');
const cartDatabase = require('../../model/cart');
const orderDatabase = require('../../model/order');
const addressDatabase = require('../../model/address')
const couponDatabase = require('../../model/coupon')
const Razorpay = require("razorpay");
const pdfDoc = require("pdfkit-table");


//route for placing order
const getPlaceOrder = async (req, res) => {
    try {
        const { userId, productId, paymentMethod } = req.body;
        console.log("User ID:", userId);
        console.log("Product ID:", productId);
        console.log("Payment Method:", paymentMethod);

        // Fetch coupon information here
        const coupon = await couponDatabase.findOne({ userId: userId });
        console.log("Coupon:", coupon);

        // Verify if coupon exists and extract discountAmount
        const discountAmount = coupon ? coupon.discount_Amount : 0;
        console.log("Discount Amount:", discountAmount);

        const cart = await cartDatabase.findOne({ userId: userId }).populate("products.product");

        const productsInCart = cart.products.map((item => ({
            product: item.product._id,
            quantity: item.quantity,
            totalPrice: (item.quantity * item.product.product_price)
        })));

        const shippingAddress = await addressDatabase.findOne({ userId: userId });
        const orderDate = new Date();

        // Inserting order
        const order = await orderDatabase.create({
            userId,
            products: productsInCart,
            shippingAddress: shippingAddress,
            orderDate: orderDate,
            paymentMethod: paymentMethod,
            discountAmount: discountAmount
        });

        console.log(order, "order");

        // Adding coupon to user database if provided in query
        if (req.query.couponId && req.query.couponId !== undefined) {
            console.log("Coupon ID:", req.query.couponId);
            try {
                const updatedUser = await userCollection.findByIdAndUpdate(userId, {
                    $push: { appliedCoupons: req.query.couponId }
                });
                if (!updatedUser) {
                    console.log("User not found or coupon not applied.");
                } else {
                    console.log("Coupon applied successfully.");
                }
            } catch (error) {
                console.error("Error applying coupon:", error);
            }
        }

        // Removing purchased products from cart
        const updateCart = await cartDatabase.updateOne(
            { userId: userId },
            { $pull: { products: { product: { $in: productsInCart.map(product => product.product) } } } }
        );

        res.redirect('/orderConfirm');
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
            const order = await orderDatabase.findOne({ userId: req.session.user._id }).sort({ orderDate: -1 }).limit(1)


            const product = await productDatabase.findOne({ productId: productId })
            res.render('user/orderConfirm', { order, loggedIn, product });
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

            const page = parseInt(req.query.page) || 1;
            const perPage = 6;

            const startIndex = (page - 1) * perPage;

            const orders = await orderDatabase
                .find({ userId: userId })
                .populate("products.product")
                .skip(startIndex)
                .limit(perPage);

            const totalOrders = await orderDatabase.countDocuments();
            const totalPages = Math.ceil(totalOrders / perPage);

            const sortOption = req.query.sortOption || null;
            const order = req.query.order || null;
            const search = req.query.search || null;

            // Calculate expected delivery date
            const deliveryDurationInDays = 7;
            const currentDate = new Date();
            const expectedDeliveryDate = new Date(currentDate.getTime() + deliveryDurationInDays * 24 * 60 * 60 * 1000);

            const orderId = req.params.id

            res.render('user/myOrders',
                {
                    loggedIn,
                    orders,
                    expectedDeliveryDate,
                    orderId,
                    page,
                    totalPages,
                    sortOption,
                    order,
                    search
                })
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

            // Update the payment status to "cancelled"
            const updatedOrder = await orderDatabase.findByIdAndUpdate(orderId,
                { $set: { paymentStatus: "Refunded" } });

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

            // Update the payment status to "Refunded"
            const updatedOrder = await orderDatabase.findByIdAndUpdate(orderId,
                { $set: { paymentStatus: "Refunded" } });


            console.log(updatedOrder, "updatedOrder");
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

            // Update order status to "Paid" if payment method is "Online"
            if (req.session && req.session.user && req.session.user.paymentMethod === "Online") {
                orderDatabase.findByIdAndUpdate(order.id, { $set: { status: "Paid" } })
                    .then(() => {
                        console.log("Order status updated to Paid");
                    })
                    .catch((error) => {
                        console.error("Error updating order status:", error);
                    });
            }

            console.log("Order created successfully:", order);
            res.status(200).json({ orderId: order.id });
        });
    } catch (error) {
        console.error("Error in postRazorpay:", error);
        res.status(500).json({ error: "Error while creating Razorpay payment", details: error });
    }
};

// invoice download
const getInvoiceDownload = async (req, res) => {
    try {
        const orderId = req.params.id;

        console.log("order id:", orderId);
        const order = await orderDatabase.findById(orderId)
            .populate('userId')
            .populate({
                path: 'products.product',
                select: 'productName'
            });;
        console.log("order:", order);

        const doc = new pdfDoc({ margin: 50 });

        doc.fontSize(18).text('TAX INVOICE', { align: 'center' });
        doc.moveDown();
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.moveDown();
        doc.fontSize(16).text('ORDER DETAILS', { underline: true });
        doc.moveDown();

        doc.fontSize(12).text(`Name: ${order.userId.username}`);
        doc.text(`Purchase email: ${order.userId.email}`);
        doc.text(`Date of Delivery: ${order.orderDate.toLocaleDateString()}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Order Status: ${order.status}`);

        // Iterate through products and add details
        doc.moveDown();
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(16).text('PRODUCT DETAILS', { underline: true });

        order.products.forEach((product, index) => {
            doc.moveDown();
            doc.fontSize(12).text(`Product:${index + 1}`, { underline: true });
            doc.text(`Product Name: ${product.productName}`);
            doc.text(`Price: ${product.totalPrice / product.quantity}`);
            doc.text(`Quantity: ${product.quantity}`);
            doc.text(`Subtotal: ${product.totalPrice}`);
            doc.text(`Delivery Charge: ${product}`)
        });

        // Calculate and display the total price of all products
        const productsTotal = order.products.reduce((total, product) => total + product.totalPrice, 0);
        doc.fontSize(14).text(`Total Price: Rs.${productsTotal}/-`, { align: 'right' });

        doc.moveDown();
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(14).text('Thank you for shopping with us!', { align: 'center' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order._id}.pdf`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.log(error);
        res.status(500).send('Error generating the PDF invoice');
    }
};

// payment failed page
const getPaymentFailed = async (req, res) => {
    try {
        const loggedIn = true;

        res.render('user/paymentFailed', { loggedIn })
    } catch (error) {
        console.log(error);
        res.status(500).send('Error generating the payment failed page');
    }
}

module.exports = {
    getOrderConfirm,
    getPlaceOrder,
    getMyOrders,
    getCancelOrder,
    postReturnOrder,
    getOrderDetail,
    postRazorpay,
    getInvoiceDownload,
    getPaymentFailed
};
