const express = require('express')
const router = express.Router()

const adminControllers = require('../controller/adminController/adminLogin'); 
const dashboardController = require('../controller/adminController/dashboardController')
const userContoller = require('../controller/adminController/userController')


router.get('/',adminControllers.getAdminLogin)
router.post('/',adminControllers.postAdminLogin)

router.get('/adminDashboard',dashboardController.getDashboard)
router.post('/adminLogout',adminControllers.adminLogout)

router.get('/userManagement',userContoller.getUserManage)
router.get('/blockUser',userContoller.getBlockUser)

module.exports =  router


