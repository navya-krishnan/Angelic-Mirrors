const productDatabase = require('../../model/product')
const categoryDatabase = require('../../model/category')

//product page
const getProductManage = async (req, res) => {
    try {
        if (req.session.admin) {
            const product = await productDatabase.find().populate('product_category')
            const category = await categoryDatabase.find();


            res.render('admin/productManagement', { product, category })
        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

//add product
const getAddProduct = async (req, res) => {
    try {
        if (req.session.admin) {

            const allCategories = await categoryDatabase.find()
            const categories  = await allCategories.filter((category)=>category.blocked)
            res.render('admin/addProduct', { categories ,error:""})
        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

const postAddProduct = async (req, res) => {
    try {
        let img;
        img = req.files.map((val) => {
            return val.filename;
        });
        const productName = req.body.productName

        const catId = req.body.productCategory
        const category = await categoryDatabase.findById(catId)

        const check = await productDatabase.findOne({
            product_name: productName
        })


        if (check) {
            console.log("Product already exists");
            const categories = await categoryDatabase.find()
            res.render('admin/addProduct', { categories,error:"Product already exists" })
        } else {
            productData = {
                product_name: req.body.productName,
                product_category: category,
                product_price: req.body.productPrice,
                product_stock: req.body.productStock,
                product_image: img
            }
            await productDatabase.insertMany([productData])
            console.log("Product added successfullly");
            res.redirect('/admin/productManagement')
        }

    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

//edit product
const getEditProduct = async (req, res) => {
    try {
        if (req.session.admin) {
            const proId = req.params.proId

            const categories = await categoryDatabase.find()
            const products = await productDatabase.findById(proId)

            if (products) {
                // Render the template with the product data
                res.render('admin/editProduct', { products, categories });
            } else {
                // Handle the case where the product is not found
                res.status(404).send("Product not found");
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

const postEditProduct = async (req, res) => {
    try {
        let img

        const category = await categoryDatabase.findOne({
            category_name: req.body.productCategory
        })

        if (req.files && req.files.length > 0) {
            img = req.files.map((val) => {
                return val.filename;
            });

            const existingProduct = await productDatabase.findById(req.params.proId)


            img = existingProduct.product_image.concat(img)
        } else {
            const existingProduct = await productDatabase.findById(req.params.proId)
            img = existingProduct.product_image
        }

        const proId = req.params.proId
        const productName = req.body.productName.toLowerCase()

        const check = await productDatabase.findOne({
            _id: { $ne: proId },
            product_name: { $regex: new RegExp("^" + productName + "$" + "i") }
        })


        if (check) {
            res.redirect(`/admin/editProduct ${proId}`)
        }

        await productDatabase.findByIdAndUpdate(
            proId,
            {
                product_name: req.body.productName,
                product_category: category._id,
                product_price: req.body.productPrice,
                product_stock: req.body.productStock,
                product_image: img
            },
            {
                new: true
            }
        )

        res.redirect('/admin/productManagement')

    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during post edit product");
    }
}

//listing and unlisting product
const getBlockProduct = async (req, res) => {
    try {
        const proId = req.query.productId

        const product = await productDatabase.findOne({ _id: proId })

        if (product) {
            const block = product.unlist

            if (block) {
                await productDatabase.findByIdAndUpdate(proId,
                    { $set: { unlist: false } }
                )
            } else {
                await productDatabase.findByIdAndUpdate(proId,
                    { $set: { unlist: true } }
                )
            }
        }

        res.redirect('/admin/productManagement')
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during listing product");
    }
}

module.exports = {
    getProductManage,
    getAddProduct,
    postAddProduct,
    getEditProduct,
    postEditProduct,
    getBlockProduct
}