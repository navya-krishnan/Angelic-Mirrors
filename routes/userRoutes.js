const express = require('express')
const router = express.Router()

const userController = require('../controller/userController/userContoller')
const otpController = require('../controller/userController/otpController')
const shopController = require('../controller/userController/shopController')

const userBlockMiddleware = require('../middleware/userControl')
const userSessionMiddleware = require('../middleware/userSession')

router.get('/userLogin', userController.userLogin)
router.post('/userLogin', userController.postLogin)

router.get('/', userBlockMiddleware.block,userController.home)
router.get('/logout', userController.userLogout)

router.get('/userSignup', userController.signup)
router.post('/userSignup', userController.postSignup) 

router.get('/otp', otpController.getsignupOtp)
router.post('/otp', otpController.postSignupOtp)
router.post('/postSignupOtp', otpController.postSignupOtp);
router.get('/resendOtp',userController.getResendOtp)

router.get('/shop',  userBlockMiddleware.block,userSessionMiddleware.isUser, shopController.getShop)
router.get('/singleProduct/:proId',  userSessionMiddleware.isUser, shopController.getSingleProduct)

module.exports = router