const categoryDatabase = require('../../model/category')

//get category page
const getCategoryManage = async (req, res) => {
    try {
        if (req.session.admin) {

            const category = await categoryDatabase.find()

            res.render('admin/categoryManagement', { category })
        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}


//add category
const getAddCategory = async (req, res) => {
    try {
        if (req.session.admin) {
            res.render('admin/addCategory', { error: " " })
        } else {
            res.redirect('/admin/adminLogin')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

const postAddCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName
        const check = await categoryDatabase.findOne({
            category_name: categoryName
        })
        console.log(categoryName, "jhdaj");
        if (check) {

            console.log("Category already exists");
            return res.render('admin/addCategory', { error: "Category already exists" })
        } else {
            const categoryData = {
                category_name: req.body.categoryName,
                category_description: req.body.categoryDescription
            }
            await categoryDatabase.insertMany([categoryData])
            console.log("Details added successfully");
            res.redirect('/admin/categoryManagement')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

//edit category
const getEditCategory = async (req, res) => {
    try {
        if (req.session.admin) {
            const categoryId = req.params.categoryId
            const category = await categoryDatabase.findById(categoryId)
            const error = req.query.error || "";

            res.render('admin/editCategory', { category ,error})
        } else {
            res.redirect('/admin/categoryManagement')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}


const postEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        const categoryName = req.body.categoryName.toLowerCase();
        const check = await categoryDatabase.findOne({
            _id: { $ne: categoryId },
            category_name: { $regex: new RegExp("^" + categoryName + "$" + "i") }
        });

        if (check) {
            res.redirect(`/admin/editCategory/${categoryId}?error=Category+name+already+exists`);
        } else {
            await categoryDatabase.findByIdAndUpdate(
                categoryId,
                {
                    category_name: req.body.categoryName,
                    category_description: req.body.categoryDescription
                },
                { new: true }
            );

            res.redirect('/admin/categoryManagement');
        }
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyValue) { //11000 : mongodb error code for duplpicate key
            // Handle duplicate key error
            const duplicateKeyName = Object.keys(error.keyPattern)[0];
            const duplicateKeyValue = error.keyValue[duplicateKeyName];
            res.redirect(`/admin/editCategory/${req.params.categoryId}?error=Category+with+name+'${duplicateKeyValue}'+already+exists`);
        } else {
            console.log(error);
            res.redirect(`/admin/editCategory/${req.params.categoryId}?error=An+error+occurred+during+editing+the+category`);
        }
    }
};


//listing and unlisting category
const getBlockCategory = async (req, res) => {
    try {
        const category = await categoryDatabase.findOne({
            category_name: req.query.category_name
        })
        if (category) {
            const block = category.blocked
            if (block) {
                await categoryDatabase.updateOne(
                    { category_name: req.query.category_name },
                    { $set: { blocked: false } }
                )
            } else {
                await categoryDatabase.updateOne(
                    { category_name: req.query.category_name },
                    { $set: { blocked: true } }
                )
            }
        }


        res.redirect('/admin/categoryManagement')
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred while unlisting category");
    }
}

module.exports = {
    getCategoryManage,
    getAddCategory,
    postAddCategory,
    getEditCategory,
    postEditCategory,
    getBlockCategory
}