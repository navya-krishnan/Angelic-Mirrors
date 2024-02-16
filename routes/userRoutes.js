const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')

router.get('/',userController.userLogin)
router.post('/',userController.postLogin)

router.get('/home',userController.home)
router.get('/logout',userController.userLogout)

router.get('/userSignup',userController.signup)
router.post('/userSignup',userController.postSignup)

router.get('/forgotPassword',userController.forgot)
router.post('/forgototp',userController.postForgotPassword)

module.exports = router