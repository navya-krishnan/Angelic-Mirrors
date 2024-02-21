const express = require('express')
const router = express.Router()
const userController = require('../controller/userController/userContoller')
const otpController = require('../controller/userController/otpController')

router.get('/userlogin',userController.userLogin)
router.post('/userlogin',userController.postLogin)

router.get('/user/home',userController.home)
router.get('/logout',userController.userLogout)

router.get('/userSignup',userController.signup)
router.post('/userSignup',userController.postSignup)

router.get('/otp',otpController.getsignupOtp)
router.post('/postSignupOtp',otpController.postSignupOtp)

module.exports = router