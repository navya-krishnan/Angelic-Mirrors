const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

const categoryCollection = require('../../model/category');
const productCollection = require('../../model/product');
const cartCollection = require('../../model/cart')

// shop
const getShop = async (req, res) => {
    try {
        if (req.session.user) {
            const page = parseInt(req.query.page) || 1;
            const perPage = 6;

            let productsQuery = productCollection.find().populate('product_category');

            // Check if there is a search query
            if (req.query.search) {
                const regex = new RegExp(escapeRegex(req.query.search), 'gi');
                productsQuery = productsQuery.find({ product_name: regex });
            }

            const allProducts = await productsQuery.exec();
            const products = allProducts.filter(product => product.product_category && product.product_category.blocked && product.unlist);

            const allCategories = await categoryCollection.find();
            const category = allCategories.filter(category => category.blocked);

            const totalPages = Math.ceil(products.length / perPage);

            const startIndex = (page - 1) * perPage;
            const endIndex = Math.min(startIndex + perPage, products.length);
            const currentProducts = products.slice(startIndex, endIndex);

            const sortOption = req.query.sortOption || null;
            const categorie = req.query.category || null;
            const search = req.query.search || null;

            const cart = await cartCollection.findOne({ userId: req.session.user._id });
            const cartQuantity = cart?.products?.length || 0;

            res.render('user/shop', {
                products: currentProducts,
                page,
                totalPages,
                category,
                cartQuantity,
                sortOption,
                categorie,
                search
            });
        } else {
            console.log("Shop is not correct");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
};

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