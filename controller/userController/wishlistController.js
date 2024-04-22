const Wishlist = require('../../model/wishlist')
const productDatabase = require('../../model/product')

//to display wishlist page
const getWishlist = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render('user/userLogin');
        }

        const userId = req.session.user._id;

        let wishlist = await Wishlist.findOne({ userId }).populate("products.product");

        if (!wishlist) {
            return res.render('user/wishlist', { wishlist });
        }

        res.render('user/wishlist', { wishlist, userId});

    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering get wishlist page");
    }
}


// Add product to wishlist
const postWishlist = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user._id;

        // Check if productId is present and not empty
        if (!productId) {
            return res.status(400).send("Product ID is required");
        }

        const product = await productDatabase.findById(productId);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [{ product: productId }] });
        } else {
            const existingProductIndex = wishlist.products.findIndex(item =>
                item.product.equals(productId)
            );

            if (existingProductIndex !== -1) {
                return res.redirect('/user/singleProduct')
            } else {
                wishlist.products.push({ product: productId, quantity: 1 });
            }
        }

        await Promise.all([wishlist.save(), product.save()]);

        res.redirect('/singleProduct/' + productId);

    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering post wishlist page");
    }
}


//remove from wishlist
const getRemoveWishlist = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render('user/userLogin');
        }

        const userId = req.session.user._id;
        const productId = req.params.id;

        const wishlist = await Wishlist.findOne({ userId }).populate("products.product");

        if (!wishlist) {
            return res.status(404).send("Wishlist not found");
        }

        // Find the product to be deleted from the wishlist
        const removeProductIndex = wishlist.products.findIndex(item =>
            item.product._id.equals(productId)
        );

        if (removeProductIndex === -1) {
            return res.status(404).send("Product not found in wishlist");
        }

        // Remove the product from the wishlist
        wishlist.products.splice(removeProductIndex, 1);
        await wishlist.save();

        res.redirect('/wishlist');
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering remove from wishlist page");
    }
}

module.exports = {
    getWishlist,
    postWishlist,
    getRemoveWishlist
}