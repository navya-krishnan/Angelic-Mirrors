const express = require('express')
const router = express.Router()
const adminControllers = require('../controller/adminController/adminLogin'); 


router.get('/adminlogin',adminControllers.getAdminLogin)
// router.post('/adminlogin',adminControllers.postAdminLogin)

module.exports =  router


