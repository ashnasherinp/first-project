const express = require('express')
const router =express.Router()
const adminController = require('../controllers/admin/adminController')
const {userAuth,adminAuth} =require('../middlewares/auth')
const customerController = require('../controllers/admin/customerController')
const categoryController  = require('../controllers/admin/categoryController')





router.get('/login',adminController.loadlogin)
router.post('/login',adminController.login)
router.get('/',adminAuth,adminController.loadDashboard)
router.get('/pageerror',adminController.pageerror)
router.get('/logout',adminController.logout)
router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockCustomer',adminAuth,customerController.customerBlocked)
router.get('/unblockCustomer',adminAuth,customerController.customerunBlocked)
router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addCategory',adminAuth,categoryController.addCategory)
router.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer)
router.post('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer)


module.exports = router