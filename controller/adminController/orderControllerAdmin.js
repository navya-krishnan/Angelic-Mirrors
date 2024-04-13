const { isAdmin } = require('../../middleware/admin');
const orderDatabase = require('../../model/order')

// get order page
const getOrderManage = async (req, res) => {
    try {
        if (req.session.admin) {
            const page = parseInt(req.query.page) || 1;
            const perPage = 6;

            const startIndex = (page - 1) * perPage;

            const orderDetails = await orderDatabase
                .find()
                .populate('userId')
                .populate({
                    path: "products.product",
                    model: "productdb"
                })
                .populate('shippingAddress')
                .skip(startIndex) 
                .limit(perPage);

            const totalOrders = await orderDatabase.countDocuments(); 
            const totalPages = Math.ceil(totalOrders / perPage); 

            const sortOption = req.query.sortOption || null;
            const order = req.query.order || null;
            const search = req.query.search || null;

            res.render('admin/orderManagement', { 
                orders: orderDetails,
                page,
                totalPages,
                sortOption,
                order,
                search
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred when rendering order management page");
    }
}

//order status updations
const getUpdateStatus = async (req, res) => {
    const orderId = req.params.orderId
    const newStatus = req.params.newStatus
    try {
        const order = await orderDatabase.findById(orderId)

        if (order.status === "Cancelled") {
            console.log("order already cancelled");
            return res.redirect('/admin/orderManagement')
        }

        const updateOrder = await orderDatabase.findByIdAndUpdate(orderId,
            { $set: { status: newStatus } },
            { new: true }
        )

        console.log(`Order status updated to ${newStatus}`);
        res.redirect('/admin/orderManagement')

    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred when rendering update order status");
    }
}

const getOrderDetail = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        // Fetch order details from the database based on the orderId
        const order = await orderDatabase.findById(orderId)
            .populate('userId')
            .populate('products.product')
            .populate('shippingAddress');

        if (!order) {
            // If order not found, you can handle it accordingly
            return res.status(404).send("Order not found");
        }

        res.render("admin/viewOrderDetail", { order });
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred when rendering order detail");
    }
}




module.exports = {
    getOrderManage,
    getUpdateStatus,
    getOrderDetail
}