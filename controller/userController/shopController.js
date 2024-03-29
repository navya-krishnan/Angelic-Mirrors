const categoryCollection = require('../../model/category');
const productCollection = require('../../model/product');
const cartCollection = require('../../model/cart')

// shop
const getShop = async (req, res) => {
    try {
        if (req.session.user) {
            const allProducts = await productCollection.find().populate('product_category');
            const products = allProducts.filter(product => product.product_category && product.product_category.blocked && product.unlist);

            const allCategories = await categoryCollection.find();
            const category = allCategories.filter(category => category.blocked);

            const cart = await cartCollection.findOne({ userId: req.session.user._id })
            const cartQuantity = cart?.products?.length || 0;

            res.render('user/shop', {
                products,
                category,
                cartQuantity
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
        if (req.session.user) {
            const proId = req.params.proId;

            const product = await productCollection.findById(proId).populate('product_category');

            const similarProducts = await productCollection.find({ product_category: product.product_category }).populate('product_category');

            res.render('user/singleProduct', { product, similarProducts, userId: req.session.user._id, productId: proId });


            if (!product) {
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
