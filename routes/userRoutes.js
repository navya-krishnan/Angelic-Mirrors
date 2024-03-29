const express = require('express')
const router = express.Router()

const userController = require('../controller/userController/userContoller')
const otpController = require('../controller/userController/otpController')
const shopController = require('../controller/userController/shopController')
const cartController = require('../controller/userController/cartController')
const profileController = require('../controller/userController/profileController')
const checkoutController = require('../controller/userController/checkoutController')
const orderController = require('../controller/userController/orderController')

const userBlockMiddleware = require('../middleware/userControl')
const userSessionMiddleware = require('../middleware/userSession')

router.get('/userLogin', userController.userLogin)
router.post('/userLogin', userController.postLogin)

router.get('/', userBlockMiddleware.block, userController.home)
router.get('/logout', userController.userLogout)

router.get('/userSignup', userController.signup)
router.post('/userSignup', userController.postSignup)

router.get('/otp', otpController.getsignupOtp)
router.post('/otp', otpController.postSignupOtp)
router.post('/postSignupOtp', otpController.postSignupOtp);
router.get('/resendOtp', userController.getResendOtp)

router.get('/forgotPassword',userController.getForgotPassword)
router.post('/forgotPassword',userController.postForgotPassword)

router.get('/forgotOtp',otpController.getForgotOtp)
router.post('/forgotOtp',otpController.postForgotOtp)

router.get('/newPassword',userController.getNewPassword)
router.post('/newPassword',userController.postNewPassword)

router.get('/shop', userBlockMiddleware.block, userSessionMiddleware.isUser, shopController.getShop)
router.get('/singleProduct/:proId', userSessionMiddleware.isUser, shopController.getSingleProduct)

router.get('/cart', userBlockMiddleware.block, cartController.getCart)
router.post('/cart',userBlockMiddleware.block,cartController.postCart)
router.get('/removecart/:id',userBlockMiddleware.block,cartController.removeCart)
router.post('/updateCart',userBlockMiddleware.block,cartController.postUpdateCart)

router.get('/profile',userBlockMiddleware.block,profileController.getProfile)
router.get('/editProfile/:id',userBlockMiddleware.block,profileController.getEditProfile)
router.post('/editProfile/:id',userBlockMiddleware.block,profileController.postEditProfile)
router.get('/addAddress',userBlockMiddleware.block,profileController.getAddAddress)
router.post('/addAddress',userBlockMiddleware.block,profileController.postAddAddress)
router.get('/editAddress/:addressId', profileController.getEditAddress);
router.post('/editAddress/:addressId', profileController.postEditAddress);
router.get('/deleteAddress/:addressId',userBlockMiddleware.block,profileController.getDeleteAddress)

router.get('/checkout',userBlockMiddleware.block,checkoutController.getCheckout)

router.get('/orderConfirm',userBlockMiddleware.block,orderController.getOrderConfirm)
router.post('/getPlaceOrder',userBlockMiddleware.block,orderController.getPlaceOrder)
router.get('/myOrders',userBlockMiddleware.block,orderController.getMyOrders)
router.get('/cancelOrder/:id',userBlockMiddleware.block,orderController.getCancelOrder)
router.get('/orderDetails/:id',userBlockMiddleware.block,orderController.getOrderDetail)


module.exports = router