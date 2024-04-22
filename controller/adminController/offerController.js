const productDatabase = require('../../model/product')
const offerDatabase = require('../../model/offer')
const categoryDatabase = require('../../model/category')
const moment = require('moment')

//to get the offer management page
const getOfferManage = async (req, res) => {
    try {
        if (req.session.admin) {
            const offers = await offerDatabase
                .find()
                .populate('product_name', 'product_name') // Populate product_name with product_name field only
                .populate('category_name', 'category_name'); // Populate category_name with category_name field only
            // console.log(offers, "offers");
            res.render('admin/offerManagement', {
                offers
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering get offer management");
    }
};


//add offer
const getAddOffer = async (req, res) => {
    try {
        if (req.session.admin) {
            const products = await productDatabase.find();
            const categories = await categoryDatabase.find();
            
            res.render('admin/addOffer', { products, categories });
        } else {
            res.redirect('/admin/offerManagement');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering get add offer page");
    }
}


const postAddOffer = async (req, res) => {
    try {
        const productOrCategory = req.body.productOrCategory;

        if (productOrCategory === "product") {
            const product = await productDatabase.findById(req.body.productName);

            if (!product) {
                console.log("Product not found");
                return res.redirect('/admin/addOffer');
            }

            const newOffer = new offerDatabase({
                product_name: product._id,
                discount_Amount: req.body.discount,
                expiryDate: req.body.expiryDate
            });

            await newOffer.save();

            console.log(newOffer, "offer product");
        } else if (productOrCategory === "category") {
            const category = await categoryDatabase.findById(req.body.categoryName );

            if (!category) {
                console.log("Category not found");
                return res.redirect('/admin/addOffer');
            }

            const newOffer = new offerDatabase({
                category_name: category._id,
                discount_Amount: req.body.discount,
                expiryDate: req.body.expiryDate
            });

            await newOffer.save();

            console.log(newOffer, "offer category");
        }

        res.redirect('/admin/offerManagement');
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering post add offer page");
    }
};


module.exports = {
    getOfferManage,
    getAddOffer,
    postAddOffer
}