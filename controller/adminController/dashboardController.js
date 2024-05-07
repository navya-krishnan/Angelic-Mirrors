const orderDatabase = require('../../model/order')
const productDatabase = require('../../model/product');
const categoryDatabase = require('../../model/category');
const userDatabase = require('../../model/user')

// Function to calculate the total monthly revenue
const getTotalMonthlyRevenue = async () => {
    try {
        // Get the current month's first and last date
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Aggregate to calculate the total revenue for the current month
        const monthlyRevenue = await orderDatabase.aggregate([
            {
                $unwind: "$products" // Unwind the products array to work with each product individually
            },
            {
                $group: {
                    _id: null, // Group by null to calculate the total across all documents
                    totalPrice: { $sum: "$products.totalPrice" } // Calculate the total price by summing up the price of each product
                }
            }
        ]);

        // Extract total revenue from aggregation results
        const totalMonthlyRevenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].totalPrice : 0;

        return totalMonthlyRevenue;
    } catch (error) {
        console.log(error);
        throw error; // Throw error for handling in calling function
    }
};

// function to calculate the yearly revenue
const getYearlyeRevenue = async () => {
    try {
        const currentDate = new Date();
        const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1, 0, 0, 0); // First day of the current year
        const lastDayOfYear = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59); // Last day of the current year

        // Aggregate to calculate the total revenue for the current year
        const yearlyRevenue = await orderDatabase.aggregate([
            {
                $match: {
                    orderDate: { $gte: firstDayOfYear, $lte: lastDayOfYear } // Match orders within the current year
                }
            },
            {
                $unwind: "$products" // Unwind the products array to work with each product individually
            },
            {
                $group: {
                    _id: null, // Group by null to calculate the total across all documents
                    totalPrice: { $sum: "$products.totalPrice" } // Calculate the total price by summing up the price of each product
                }
            }
        ]);


        // Extract total revenue from aggregation results
        const totalYearlyRevenue = yearlyRevenue.length > 0 ? yearlyRevenue[0].totalPrice : 0;

        return totalYearlyRevenue;

    } catch (error) {
        console.log("error in yearly revenue", error);
        throw error; // Throw error for handling in calling function
    }
}

// Function to calculate the total count of products sold
const getTotalProductSold = async () => {
    try {
        // Fetch all orders
        const orders = await orderDatabase.find();

        // Initialize an object to store the count of each product sold
        const productSoldCount = {};

        // Iterate through each order and count the quantity of each product sold
        for (const order of orders) {
            for (const item of order.products) {
                const productId = item.product.toString();
                const quantity = item.quantity;
                if (!productSoldCount[productId]) {
                    productSoldCount[productId] = 0;
                }
                productSoldCount[productId] += quantity;
            }
        }

        // Calculate the total count of products sold
        const totalCount = Object.values(productSoldCount).reduce((acc, val) => acc + val, 0);

        return totalCount;
    } catch (error) {
        console.log("Error in calculating total product sold:", error);
        throw error;
    }
}

// Function to calculate the total number of users
const getTotalUsers = async () => {
    try {
        // Fetch all users and count the documents
        const totalUsers = await userDatabase.countDocuments();

        return totalUsers;
    } catch (error) {
        console.log("Error in calculating total customers:", error);
        throw error;
    }
}


//dashboard
const getDashboard = async (req, res) => {
    try {
        if (req.session.admin) {

            // Fetch orders
            const orders = await orderDatabase.find();

            // Fetch all products and categories
            const products = await productDatabase.find();
            const categories = await categoryDatabase.find();

            // Initialize an empty object to store the count of orders for each product and category
            const productCounts = {};
            const categoryCounts = {};

            // Count the number of orders for each product
            for (const order of orders) {
                for (const item of order.products) {
                    const productId = item.product.toString();
                    if (!productCounts[productId]) {
                        productCounts[productId] = 0;
                    }
                    productCounts[productId]++;

                    const product = products.find(p => p._id.toString() === productId);
                    if (product) {
                        const categoryId = product.product_category.toString();
                        if (!categoryCounts[categoryId]) {
                            categoryCounts[categoryId] = 0;
                        }
                        categoryCounts[categoryId]++;
                    }
                }
            }


            // Convert the productCounts object into an array of objects
            const productCountsArray = Object.keys(productCounts).map(productId => ({
                productId,
                count: productCounts[productId]
            }));

            // Convert the categoryCounts object into an array of objects
            const categoryCountArray = Object.keys(categoryCounts).map(categoryId => ({
                categoryId,
                count: categoryCounts[categoryId]
            }));

            // Sort the products by the count of orders in descending order
            productCountsArray.sort((a, b) => b.count - a.count);

            // Sort the categories by the count of orders in descending order
            categoryCountArray.sort((a, b) => b.count - a.count);

            // Limit the result to display only the top-selling products and categories
            const topSellingProducts = productCountsArray.slice(0, 10);
            const topSellingCategories = categoryCountArray.slice(0, 10);

            // Fetch the product details for the top-selling products
            const topSellingProductsDetails = await Promise.all(topSellingProducts.map(async item => {
                const product = products.find(p => p._id.toString() === item.productId);
                return {
                    product,
                    count: item.count
                };
            }));

            // Fetch the category details for the top-selling categories
            const topSellingCategoryDetails = await Promise.all(topSellingCategories.map(async item => {
                const category = categories.find(c => c._id.toString() === item.categoryId);
                return {
                    category,
                    count: item.count
                };
            }));

            // Call the function to get total monthly revenue
            const monthlyTotalRevenue = await getTotalMonthlyRevenue();

            const yearlyTotalRevenue = await getYearlyeRevenue()

            // finding total count of products sold
            const totalProductSold = await getTotalProductSold();

            // finding total users
            const totalUsers = await getTotalUsers();


            // Render the admin dashboard page with the top-selling products and categories
            res.render('admin/adminDashboard', {
                topSellingProducts: topSellingProductsDetails,
                topSellingCategories: topSellingCategoryDetails,
                monthlyTotalRevenue: monthlyTotalRevenue,
                yearlyTotalRevenue: yearlyTotalRevenue,
                totalProductSold: totalProductSold,
                totalUsers: totalUsers
            });
        } else {
            res.render('admin/adminLogin');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}



module.exports = {
    getDashboard,
    getTotalMonthlyRevenue,
    getYearlyeRevenue
}
