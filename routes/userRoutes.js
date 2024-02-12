const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')

router.get('/',userController.userLogin)
router.post('/',userController.postLogin)

router.get('/home',userController.home)
router.get('/logout',userController.userLogout)

module.exports = router