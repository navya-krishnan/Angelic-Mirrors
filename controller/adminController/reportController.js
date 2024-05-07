const orderDatabase = require('../../model/order');
const User = require('../../model/user');
const Coupon = require('../../model/coupon');
const PDFDocument = require('pdfkit-table');
const { underline } = require('pdfkit');
const { getTotalMonthlyRevenue } = require('./dashboardController');
const {getYearlyeRevenue} = require('./dashboardController')

// Function to get the sales report
const getSalesReport = async (req, res) => {
    try {
        if (req.session.admin) {
            const page = parseInt(req.query.page) || 1;
            const perPage = 6;

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

            // Get discount amount from user database
            const userDiscountAmount = user.discountAmount || 0; // Assuming discountAmount is a field in the user schema
            console.log(userDiscountAmount, "user");


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
                .populate('discountAmount')
                .populate('shippingAddress')
                .select('+discountedPrice')
                .skip(startIndex)
                .limit(perPage);

            const totalOrders = await orderDatabase.countDocuments(query);
            const totalPages = Math.ceil(totalOrders / perPage);

            const sortOption = req.query.sortOption || null;
            const order = req.query.order || null;
            const search = req.query.search || null;

            // Get discount amount from coupon database
            const activeCoupons = await orderDatabase.find({});
            const couponDiscountAmount = activeCoupons.reduce((total, coupon) => total + coupon.discount_Amount, 0);


            // Calculate and populate discountedPrice field for each order
            orderDetail.forEach(order => {
                const totalAmount = order.products.reduce((total, product) => {
                    return total + product.totalPrice;
                }, 0);
                order.discountedPrice = totalAmount - order.discountAmount; // Subtract discountAmount from totalAmount

                // Check if a coupon is applied to this order
                order.couponApplied = activeCoupons.some(coupon => coupon.discount_Amount === order.discountAmount);
            });

            // Combine discount amounts
            let totalDiscountAmount;
            if (couponDiscountAmount > 0) {
                totalDiscountAmount = userDiscountAmount + couponDiscountAmount;
            } else {
                totalDiscountAmount = userDiscountAmount;
            }

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
        const { startDate, endDate } = req.query;

        const query = constructQuery("Delivered", startDate, endDate);
        let orders = await orderDatabase
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
            .populate('shippingAddress');

        console.log(orders, "user");

        // Calculate and set the Total Amount for each order
        orders.forEach(order => {
            const totalAmount = order.products.reduce((total, product) => {
                return total + product.totalPrice;
            }, 0);
            order.totalAmount = totalAmount;
        });

        console.log(orders, "orders");

        // Extracting relevant data for each order
        orders = orders.map((order, index) => ({
            'Index': index + 1,
            'Customer Name': order.userId.username,
            'Payment Method': order.paymentMethod,
            'Order Date': new Date(order.orderDate).toLocaleDateString(),
            'Discount Amount': order.discountAmount,
            'Total Amount': order.totalAmount
        }));

        console.log(orders, "orders");

        // Calculate summary
        const totalSales = await orderDatabase.countDocuments();
        const totalOrders = orders.length;
        const totalMonthlyRevenue = await getTotalMonthlyRevenue();
        const totalYearlyRevenue = await getYearlyeRevenue();
        
        // Create PDF document
        const doc = new PDFDocument();
        const pdfDoc = pdfGenerator(doc, orders, totalSales, totalOrders, totalMonthlyRevenue, totalYearlyRevenue);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="sales-details.pdf"');

        // Pipe the PDF document to response
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
function pdfGenerator(doc, orders, totalSales, totalOrders, totalMonthlyRevenue, totalYearlyRevenue) {
    // Add Sales Report heading
    doc.font('Helvetica-Bold').fontSize(20).text('Sales Report', {
        align: 'center',
        underline: true,
        continued: false // Ensure it doesn't continue to the next line
    }).moveDown(); // Move to the next line after the underlined text

    doc.font('Helvetica');
    doc.fontSize(12)

    // Add order summary heading
    doc.font('Helvetica-Bold').fontSize(16).text('Order Summary', { align: 'left', underline: true }).moveDown();

    // Reset font to regular for the rest of the text
    doc.font('Helvetica');
    doc.fontSize(12)

    // Add order summary
    doc.text(`Total Orders: ${totalSales}`, { align: 'left' })
        .moveDown()
        .text(`Total Orders(Delivered): ${totalOrders}`, { align: 'left' })
        .moveDown()
        .text(`Total Monthly Revenue: Rs.${totalMonthlyRevenue.toFixed(2)}`, { align: 'left' })
        .moveDown()
        .text(`Total Yearly Revenue: Rs.${totalYearlyRevenue.toFixed(2)}`, { align: 'left' })
        .moveDown();



    // Define table headers
    const tableHeaders = ['Si.No', 'Customer Name', 'Payment Method', 'Order Date', 'Discount Amount', 'Total Amount'];

    // Calculate column widths
    const columnWidths = [70, 70, 70, 70, 70, 70];

    // Set initial x coordinate for table
    let x = 50;

    // Add table headers
    doc.font('Helvetica-Bold');
    tableHeaders.forEach((header, index) => {
        doc.text(header, x, 300, { width: columnWidths[index], align: 'left' });
        x += columnWidths[index] + 20; // Add padding between columns
    });
    doc.moveDown();

    // Reset x coordinate for table data
    x = 50;

    // Add table data
    const rowHeight = 50;
    let y = 350;
    orders.forEach((order) => {
        // Reset x coordinate for each row
        let x = 50;
        doc.font('Helvetica');
        Object.entries(order).forEach(([key, value], valueIndex) => {
            const textValue = key === 'Total Amount' && value !== undefined ? `Rs.${value.toFixed(2)}` : value?.toString() ?? '';
            doc.text(textValue, x, y, { width: columnWidths[valueIndex], align: 'left' });
            x += columnWidths[valueIndex] + 20; // Add padding between columns
        });

        // Increment y for the next row
        y += rowHeight; // Assuming rowHeight is defined earlier in your code
    });

    return doc;
}


module.exports = {
    getSalesReport,
    getGeneratePdf
};