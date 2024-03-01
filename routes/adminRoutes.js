const express = require('express')
const multer = require('../middleware/multer')
const router = express.Router()


const adminControllers = require('../controller/adminController/adminLogin');
const dashboardController = require('../controller/adminController/dashboardController')
const userContoller = require('../controller/adminController/userController')
const categoryController = require('../controller/adminController/categoryController')
const productContoller = require('../controller/adminController/productController')

const adminSessionMiddleware = require('../middleware/admin')


router.get('/', adminControllers.getAdminLogin)
router.post('/', adminControllers.postAdminLogin)

router.get('/adminDashboard', adminSessionMiddleware.isAdmin, dashboardController.getDashboard)
router.get('/adminLogout', adminControllers.adminLogout)

router.get('/userManagement', adminSessionMiddleware.isAdmin, userContoller.getUserManage)
router.get('/blockUser', adminSessionMiddleware.isAdmin, userContoller.getBlockUser)

router.get('/categoryManagement', adminSessionMiddleware.isAdmin, categoryController.getCategoryManage)
router.get('/addCategory', adminSessionMiddleware.isAdmin, categoryController.getAddCategory)
router.post('/addCategory', adminSessionMiddleware.isAdmin, categoryController.postAddCategory)
router.get('/editCategory/:categoryId', adminSessionMiddleware.isAdmin, categoryController.getEditCategory)
router.post('/editCategory/:categoryId', adminSessionMiddleware.isAdmin, categoryController.postEditCategory)
router.get('/blockCategory', adminSessionMiddleware.isAdmin, categoryController.getBlockCategory)

router.get('/productManagement', adminSessionMiddleware.isAdmin, productContoller.getProductManage)
router.get('/addProduct', adminSessionMiddleware.isAdmin, productContoller.getAddProduct)
router.post('/addProduct', adminSessionMiddleware.isAdmin, multer.upload.array('productImage', 3), productContoller.postAddProduct)
router.get('/editProduct/:proId', adminSessionMiddleware.isAdmin, productContoller.getEditProduct)
router.post('/editProduct/:proId', adminSessionMiddleware.isAdmin, multer.upload.array('productImage', 3), productContoller.postEditProduct)
router.get('/blockProduct', adminSessionMiddleware.isAdmin, productContoller.getBlockProduct)

module.exports = router
