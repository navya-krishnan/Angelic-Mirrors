const orderDatabase = require('../../model/order');
const User = require('../../model/user');
const Coupon = require('../../model/coupon');
const PDFDocument = require("pdfkit");

// Function to get the sales report
const getSalesReport = async (req, res) => {
    try {
        if (req.session.admin) {
            const page = parseInt(req.query.page) || 1;
            const perPage = 4;

            const startIndex = (page - 1) * perPage;

            let query = { status: "Delivered" };
            if (req.query.startDate && req.query.endDate) {
                const startDate = new Date(req.query.startDate);
                const endDate = new Date(req.query.endDate);

                query.orderDate = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            // Check if user session exists
            if (!req.session.user) {
                console.log("User session not found");
                return res.redirect('/login'); // Redirect to login page or handle as needed
            }

            // Fetch user data from database
            const user = await User.findById(req.session.user._id);
            if (!user) {
                console.log("User not found");
                return res.redirect('/login'); // Redirect to login page or handle as needed
            }

            const orderDetail = await orderDatabase
                .find(query)
                .populate({
                    path: 'userId',
                    select: 'username',
                    model: 'users'
                })
                .populate({
                    path: 'products.product',
                    model: "productdb"
                })
                .populate('shippingAddress')
                .select('+discountedPrice')
                .skip(startIndex)
                .limit(perPage);

            const totalOrders = await orderDatabase.countDocuments();
            const totalPages = Math.ceil(totalOrders / perPage);

            const sortOption = req.query.sortOption || null;
            const order = req.query.order || null;
            const search = req.query.search || null;

            // Calculate and populate discountedPrice field for each order
            orderDetail.forEach(order => {
                const totalAmount = order.products.reduce((total, product) => {
                    return total + product.totalPrice;
                }, 0);
                order.discountedPrice = totalAmount - order.discountAmount; // Subtract discountAmount from totalAmount
            });

            // Get discount amount from user database
            const userDiscountAmount = user.discountAmount || 0; // Assuming discountAmount is a field in the user schema

            // Get discount amount from coupon database
            const activeCoupons = await Coupon.find({ blocked: false });
            const couponDiscountAmount = activeCoupons.reduce((total, coupon) => total + coupon.discount_Amount, 0);

            console.log("Active Coupons:", activeCoupons);
            console.log("Coupon Discount Amount:", couponDiscountAmount);

            // Combine discount amounts
            const totalDiscountAmount = userDiscountAmount + couponDiscountAmount;

            console.log("Total discount amount:", totalDiscountAmount);

            res.render('admin/salesReport', {
                orders: orderDetail,
                totalDiscount: totalDiscountAmount,
                coupon: req.session.coupon,
                page,
                totalPages,
                sortOption,
                order,
                search
            });
        } else {
            console.log("User is not an admin");
            res.status(403).send("Unauthorized");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering get sales report");
    }
};


// Function to generate PDF
const getGeneratePdf = async (req, res) => {
    try {
        console.log("sales report");
        const userId = req.session.user._id;
        const { startDate, endDate } = req.query;

        const query = constructQuery("Delivered", startDate, endDate);
        let orders = await orderDatabase.find(query);

        const doc = new PDFDocument();

        const pdfDoc = pdfGenerator(doc, orders, userId);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="sales-details.pdf"');

        pdfDoc.pipe(res);

        // End the PDF document
        pdfDoc.end();
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering get generate pdf");
    }
};

// Function to construct query with date filters
function constructQuery(status, startDate, endDate) {
    let query = { status };

    // Apply date filters
    if (startDate && endDate) {
        query.orderDate = {
            $gte: new Date(startDate),
            $lt: new Date(endDate)
        };
    }

    return query;
}

// Function to generate PDF document
function pdfGenerator(doc, orders) {
    doc.fontSize(12).text('Sales Report\n\n');
    orders.forEach(order => {
        doc.text(`Order ID: ${order._id}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`);
        doc.text(`Status: ${order.status}`);
        doc.text(`Discount Amount: ${order.discountAmount}`);
        doc.text(`Total Amount: ${order.discountedPrice}`);
        doc.text('');
    });
    return doc;
}


module.exports = {
    getSalesReport,
    getGeneratePdf
};
