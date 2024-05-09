const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

const categoryCollection = require('../../model/category');
const productCollection = require('../../model/product');
const cartCollection = require('../../model/cart')
const offerCollection = require('../../model/offer')

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
            let products = allProducts.filter(product => product.product_category && product.product_category.blocked && product.unlist);

            // Retrieve category offers
            const categoryOffers = await offerCollection.find({ category_name: { $exists: true } });

            // Apply category offers to products
            products = products.map(product => {
                const matchingCategoryOffer = categoryOffers.find(offer => product.product_category._id.equals(offer.category_name));
                if (matchingCategoryOffer) {
                    const discountAmount = matchingCategoryOffer.discount_Amount;
                    product.offerPrice = product.price - (product.price * (discountAmount / 100));
                }
                return product;
            });

            const allCategories = await categoryCollection.find();
            const category = allCategories.filter(category => category.blocked);

            const totalPages = Math.ceil(products.length / perPage);

            const startIndex = (page - 1) * perPage;
            const endIndex = Math.min(startIndex + perPage, products.length);
            let currentProducts = products.slice(startIndex, endIndex);

            const sortOption = req.query.sortOption || null;
            const categorie = req.query.category || null;
            const search = req.query.search || null;

            // Sort products based on the sortOption
            if (sortOption === 'nameAsc') {
                currentProducts.sort((a, b) => a.product_name.localeCompare(b.product_name));
            } else if (sortOption === 'nameDesc') {
                currentProducts.sort((a, b) => b.product_name.localeCompare(a.product_name));
            }

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
            res.redirect('/login'); // Redirect to login page if user is not logged in
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

            if (!product) {
                return res.status(400).send("Product not found");
            }

            const similarProducts = await productCollection.find({ product_category: product.product_category }).populate('product_category');

            res.render('user/singleProduct', { product, similarProducts, userId: req.session.user._id, productId: proId });

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