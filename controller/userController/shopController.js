const categoryCollection = require('../../model/category');
const productCollection = require('../../model/product');

// shop
const getShop = async (req, res) => {
    try {
        if(req.session.user){
            const allProducts = await productCollection.find().populate('product_category');
            const products = allProducts.filter(product => product.product_category && product.product_category.blocked); // Check if product_category exists

            const allCategories = await categoryCollection.find();
            const category = allCategories.filter(category => category.blocked);

            res.render('user/shop', {
                products,
                category
            });
            
        } else {
            console.log("Shop is not correct");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
};

// single product
const getSingleProduct = async (req, res) => {
    try {
        if(req.session.user){
            const proId = req.params.proId;

            const product = await productCollection.findById(proId).populate('product_category');

            const similarProducts = await productCollection.find({ product_category: product.product_category }).populate('product_category');
            
            res.render('user/singleProduct', { product, similarProducts });

            if(!product){
                return res.status(400).send("Product not found");
            }
        } else {
            console.log("Cannot get single product");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
};

module.exports = {
    getShop,
    getSingleProduct
};
