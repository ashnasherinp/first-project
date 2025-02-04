
const express = require('express');
const passport = require('passport'); 
const router = express.Router();
const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileControllers')
const productController = require('../controllers/user/productController')
const wishlistController = require('../controllers/user/wishlistController')
const cartController = require('../controllers/user/cartController')
const checkoutController = require('../controllers/user/checkoutController')
const orderController = require('../controllers/user/orderController');
const addressController = require('../controllers/user/addressController');
const paymentController = require('../controllers/user/paymentController');

const {userAuth,adminAuth} =require('../middlewares/auth')

router.get('/pageNotFound', userController.pageNotFound);
router.get('/signup', userController.loadSignup);
router.post('/signup', userController.signup);

router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);


router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signup' }),
    (req, res) => {
        // Set the session the same way as regular login
        req.session.users = req.user;
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.redirect('/signup');
            }
            res.redirect('/');
        });
    }
);

router.get('/login',userController.loadlogin)
router.post('/login',userController.login)
router.get('/logout',userController.logout)

router.get('/', userController.loadHomepage);
router.get('/shop',userController.loadShoppingPage);
router.post('/search',userAuth,userController.searchProducts)

router.get("/aboutUs", userController.aboutUs)


router.get('/forgot-password',profileController.getForgotPassPage)
router.post('/forgot-email-valid',profileController.forgotEmailValid)
router.post('/verify-passForgot-otp',profileController.verifyForgotPassOtp)
router.get('/reset-password',profileController.getResetPassPage)
router.post('/resend-forgot-otp',profileController.resendOtp)
router.post('/reset-password',profileController.postNewPassword)
router.get('/userProfile',userAuth,profileController.userProfile)
router.get('/change-email',userAuth,profileController.changeEmail)
router.post('/change-email',userAuth,profileController.changeEmailValid)
router.post('/verify-email-otp',userAuth,profileController.verifyEmailOtp)
router.post('/update-email',userAuth,profileController.updateEmail)
router.get('/change-password',userAuth,profileController.changePassword)
router.post('/change-password',userAuth,profileController.changePasswordValid)
router.post('/verify-email-otp',userAuth,profileController.verifyEmailOtp)
router.post('/verify-changepassword-otp',userAuth,profileController.verifyChangePassOtp)
router.get('/addAddress',userAuth,profileController.addAddress)
router.post('/addAddress',userAuth,profileController.postAddAddress)
router.get('/editAddress',userAuth,profileController.editAddress)
router.post('/editAddress',userAuth,profileController.PostEditAddress)
router.get('/deleteAddress',userAuth,profileController.deleteAddress)


router.get('/productDetails',userAuth,productController.productDetails)

router.get('/wishlist',userAuth,wishlistController.loadWishlist)

router.post('/addToWishlist',userAuth,wishlistController.addToWishlist)
router.get('/removeFromWishlist',userAuth,wishlistController.removeProduct)

router.get('/cart',userAuth,cartController.getCart)
router.post('/addToCart',userAuth,cartController.addToCart)
router.post('/updateCartQuantity',userAuth,cartController.updateCartQuantity);
router.post('/removeFromCart',userAuth,cartController.removeProduct )


router.get('/checkout', userAuth,checkoutController.getCheckout); 

  
router.post('/checkout', userAuth,checkoutController.checkout); 


router.post('/apply-coupon',userAuth,checkoutController.applyCoupon);
router.get('/remove-coupon',userAuth,checkoutController.removeCoupon);

router.get('/available-coupons', userAuth,checkoutController.availableCoupons); 

router.post('/addAddressForOrder', userAuth, addressController.addAddressForOrder);

router.post('/placeOrder', userAuth, orderController.placeOrder);
router.get("/orderConfirmation", userAuth, orderController.orderDetails)

router.post('/cancel-order/:orderId', profileController.cancelOrder);
router.get('/view-order/:orderId', profileController.viewOrder);

router.post('/return-product/:orderId/:productId', profileController.returnProduct);

router.post("/createPayment", paymentController.createPayment);
router.post("/verifyPayment", paymentController.verifyPayment);

router.get('/order/download/:orderId', orderController.downloadOrderPDF);


router.post('/recreatePayment/:orderId',paymentController.recreatePayment);


module.exports = router;

