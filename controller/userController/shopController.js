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
            console.log(categoryOffers, "catoff");
            
            const productOffers = await offerCollection.find({ product_name: { $exists: true } })
            console.log(productOffers, "prooff");
            
            // Define discountPercentage outside the loop
            let discountPercentage = 0; // Default value
            
            // Apply offers to products
            products = products.map(product => {
                // Check for matching category offer
                const matchingCategoryOffer = categoryOffers.find(offer => product.product_category._id.equals(offer.category_name));
                // Check for matching product offer
                const matchingProductOffer = productOffers.find(offer => product._id.equals(offer.product_name));
            
                if (matchingCategoryOffer && matchingProductOffer) {
                    // If both category and product offers exist, choose the one with the highest discount
                    if (matchingCategoryOffer.discount_Amount > matchingProductOffer.discount_Amount) {
                        discountPercentage = matchingCategoryOffer.discount_Amount;
                    } else {
                        discountPercentage = matchingProductOffer.discount_Amount;
                    }
                } else if (matchingCategoryOffer) {
                    // If only category offer exists
                    discountPercentage = matchingCategoryOffer.discount_Amount;
                } else if (matchingProductOffer) {
                    // If only product offer exists
                    discountPercentage = matchingProductOffer.discount_Amount;
                } else {
                    // If no offer exists
                    discountPercentage = 0;
                }
                
                // Calculate offer price
                product.offerPrice = discountPercentage > 0 ? product.price - (product.price * (discountPercentage / 100)) : null;
                
                // Assign discountPercentage to product for template rendering
                product.discountPercentage = discountPercentage;
            
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
                category: [],
                cartQuantity,
                sortOption,
                categorie,
                search,
                discountPercentage
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
};5


module.exports = {
    getShop,
    getSingleProduct
};
