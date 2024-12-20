const express = require('express')
const router =express.Router()
const adminController = require('../controllers/admin/adminController')
const {userAuth,adminAuth} =require('../middlewares/auth')
const customerController = require('../controllers/admin/customerController')

router.get('/login',adminController.loadlogin)
router.post('/login',adminController.login)
router.get('/',adminAuth,adminController.loadDashboard)
router.get('/pageerror',adminController.pageerror)
router.get('/logout',adminController.logout)
router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockCustomer',adminAuth,customerController.customerBlocked)
router.get('/unblockCustomer',adminAuth,customerController.customerunBlocked)


module.exports = router