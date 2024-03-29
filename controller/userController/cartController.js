const Cart = require('../../model/cart');
const User = require('../../model/user');
const Product = require('../../model/product');

const getCart = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render('user/userLogin');
        }

        const userId = req.session.user._id;

        let cart = await Cart.findOne({ userId }).populate("products.product");

        if (!cart) {
            return res.render('user/cart', { cart });
        }

        let cartTotal = 0;
        if (cart && !cart.cartTotal) {
            const cartTotal = cart.products.reduce((total, product) => {
                return total + product.product.product_price * product.quantity;
            }, 0)

            cart.cartTotal = cartTotal;
            await cart.save()
        }

        // Check if maximum quantity limit is reached
        const cartQuantity = cart.products.reduce((total, product) => total + product.quantity, 0);
        const maxQuantityError = cartQuantity >= max_product_quantity_per_person;
        const minQuantityError = cartQuantity <= min_product_quantity_per_person;

        res.render('user/cart', { cart, cartQuantity, cartTotal, maxQuantityError, minQuantityError });
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering get cart page");
    }
};

const max_product_quantity_per_person = 5;
const min_product_quantity_per_person = 1;

const postCart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.body.userId;
        const quantity = parseInt(req.body.quantity); 

        // Fetch the product from the database
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        // Check if the requested quantity is available in stock
        if (product.product_stock < quantity) {
            return res.status(400).send("Requested quantity exceeds available stock");
        }

        // Check if the user has already added this product to the cart
        const userCart = await Cart.findOne({ userId });
        if (userCart) {
            const existingProductIndex = userCart.products.findIndex(item =>
                item.product._id.equals(productId)
            );

            if (existingProductIndex !== 1) {
                // If the product already exists in the cart, check if the new quantity exceeds the limit
                const totalQuantityInCart = userCart.products.reduce((total, product) => total + product.quantity, 0);
                if (totalQuantityInCart + quantity > max_product_quantity_per_person) {
                    return res.status(400).send(`You can only add up to ${max_product_quantity_per_person} units of this product to your cart`);
                }
            }
        }

        // Create or update the cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, products: [{ product: productId, quantity }] });
        } else {
            const existingProductIndex = cart.products.findIndex(item =>
                item.product._id.equals(productId)
            );

            if (existingProductIndex !== -1) {
                // Product already exists in the cart, update quantity
                cart.products[existingProductIndex].quantity += quantity;
            } else {
                // Product does not exist in the cart, add it
                cart.products.push({ product: productId, quantity });
            }
        }

        // Decrement the stock of the product by the requested quantity
        product.product_stock -= quantity;
         

        await product.save();

        let cartTotal = 0;
        for (const product of cart.products) {
            const productPrice = parseFloat(product.product.product_price); 
            const productQuantity = parseInt(product.quantity); 
            if (!isNaN(productPrice) && !isNaN(productQuantity)) {
                cartTotal += productPrice * productQuantity;
            }
        }

        // Update total price in the cart
        cart.cartTotal = cartTotal;

        await cart.save();
        res.redirect('/cart');
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering post cart page");
    }
};


const removeCart = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.status(400).send("User not logged in");
        }

        const productId = req.params.id;
        const userId = req.session.user._id;

        const cart = await Cart.findOne({ userId }).populate("products.product");

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        // Find the product to be removed from the cart
        const productToRemove = cart.products.find(item =>
            item.product._id.equals(productId)
        );

        if (!productToRemove) {
            return res.status(404).send("Product not found in cart");
        }

        // Increment the stock of the removed product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found");
        }

        product.product_stock += productToRemove.quantity;

        // Save the updated product information back to the database
        await product.save();

        // Remove the product from the cart
        await Cart.updateOne(
            { userId: userId },
            { $pull: { products: { product: productId } } }
        );

        res.redirect('/cart');
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while removing product from cart");
    }
};


const postUpdateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user._id;

        let cart = await Cart.findOne({ userId });

        const productIndex = cart.products.findIndex(item =>
            item.product._id.equals(productId)
        );

        const previousQuantity = cart.products[productIndex].quantity;

        cart.products[productIndex].quantity = quantity;

        const quantityDifference = quantity - previousQuantity;

        const product = await Product.findById(productId);

        product.product_stock -= quantityDifference;

        await Promise.all([cart.save(), product.save()]);

        res.sendStatus(200); 
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while updating cart");
    }
};



module.exports = {
    getCart,
    postCart,
    removeCart,
    postUpdateCart
};
