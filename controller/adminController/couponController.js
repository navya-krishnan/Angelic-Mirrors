const couponDatabase = require('../../model/coupon')
const moment = require('moment')

//get coupon page 
const getCouponManage = async (req, res) => {
    try {
        if (req.session.admin) {
            const page = parseInt(req.query.page) || 1;
            const perPage = 6;

            const startIndex = (page - 1) * perPage;

            const couponId = req.body.couponId;
            const coupon = await couponDatabase.find().skip(startIndex).limit(perPage);

            const totalCoupon = await couponDatabase.countDocuments();
            const totalPages = Math.ceil(totalCoupon / perPage);

            const sortOption = req.query.sortOption || null;
            const coupons = req.query.coupons || null;
            const search = req.query.search || null;

            res.render('admin/couponManagement', { 
                coupon, 
                couponId,
                page,
                totalPages,
                sortOption,
                coupons,
                search 
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering get coupon management");
    }
}

//add coupon
const getAddCoupon = async (req, res) => {
    try {
        if (req.session.admin) {
            res.render('admin/addCoupon')
        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering get coupon management");
    }
}

const postAddCoupon = async (req, res) => {
    try {
        const couponName = req.body.couponName
        const checkCouponExists = await couponDatabase.findOne({
            coupon_Name: { $regex: new RegExp("^" + couponName + "$", "i") }
        })
        console.log(req.body, "kejkd");
        if (checkCouponExists) {
            console.log("Coupon already exists")
            res.redirect('/admin/addCoupon?error=Product+already+exists');
        } else {
            const couponData = {
                coupon_Name: req.body.couponName,
                coupon_Code: req.body.couponCode,
                discount_Amount: req.body.discountAmount,
                minimum_Amount: req.body.minimumPurchaseAmount,
                maximum_Amount: req.body.maximumPurchaseAmount,
                expiry_Date: moment(req.body.expiryDate, "DD/MM/YYYY").toDate()
            }


            const coupondet = await couponDatabase.insertMany([couponData])
            console.log(coupondet, "coupon");
            console.log("Coupon added successfully");
            res.redirect('/admin/couponManagement')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering post coupon management");
    }
}

//edit coupon
const getEditCoupon = async (req, res) => {
    try {
        if (req.session.admin) {
            const couponId = req.params.couponId

            if (!couponId) {
                console.log("no coupon id is pprovided");
                return res.redirect('/admin/couponManagement');
            }

            const coupon = await couponDatabase.findById(couponId)

            const errors = req.query.errors || "";

            res.render('admin/editCoupon', { coupon, errors })
        } else {
            res.redirect('/admin/couponManagement')
        }

    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred during rendering get edit coupon page");
    }
}

const postEditCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId

        const couponName = req.body.couponName

        const couponExists = await couponDatabase.findOne({
            _id: { $ne: couponId },
            coupon_Name: { $regex: new RegExp("^" + couponName + "$", "i") }
        })

        if (couponExists) {
            res.redirect(`/admin/editCoupon/${couponId}?error=Coupon+name+already+exists`);
        } else {
            await couponDatabase.findByIdAndUpdate(
                couponId,
                {
                    coupon_Name: req.body.couponName,
                    coupon_Code: req.body.couponCode,
                    discount_Amount: req.body.discountAmount,
                    minimum_Amount: req.body.minimumPurchaseAmount,
                    maximum_Amount: req.body.maximumPurchaseAmount,
                    expiry_Date: moment(req.body.expiryDate, "DD/MM/YYYY").toDate()
                },
                {
                    new: true
                }
            )
            res.redirect('/admin/couponManagement')
        }

    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyValue) { //11000 : mongodb error code for duplpicate key
            // Handle duplicate key error
            const duplicateKeyName = Object.keys(error.keyPattern)[0];
            const duplicateKeyValue = error.keyValue[duplicateKeyName];
            res.redirect(`/admin/editCoupon/${req.params.couponId}?error=Coupon+with+name+'${duplicateKeyValue}'+already+exists`);
        } else {
            console.log(error);
            res.redirect(`/admin/editCoupon/${req.params.couponId}?error=An+error+occurred+during+editing+the+coupon`);
        }
    }
}

//listing and unlisting
const getBlockCoupon = async (req, res) => {
    try {
        const coupon = await couponDatabase.findOne({
            coupon_Name: req.query.coupon_Name
        })

        if (coupon) {
            const block = coupon.blocked
            if (block) {
                await couponDatabase.updateOne(
                    { coupon_Name: req.query.coupon_Name },
                    { $set: { blocked: false } }
                )
            }else{
                await couponDatabase.updateOne(
                    { coupon_Name: req.query.coupon_Name },
                    { $set: { blocked: true } }
                )
            }
        }

        res.redirect('/admin/couponManagement')

    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred while unlisting coupon");
    }
}

module.exports = {
    getCouponManage,
    getAddCoupon,
    postAddCoupon,
    getEditCoupon,
    postEditCoupon,
    getBlockCoupon
}