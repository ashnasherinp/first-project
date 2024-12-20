
const express = require('express');
const passport = require('passport'); 
const router = express.Router();
const userController = require('../controllers/user/userController');


router.get('/', userController.loadHomepage);
router.get('/pageNotFound', userController.pageNotFound);
router.get('/signup', userController.loadSignup);
router.post('/signup', userController.signup);
// router.get('/login', userController.loadShopping);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] })); 
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
    res.redirect('/');
});

router.get('/login',userController.loadlogin)
router.post('/login',userController.login)
router.get('/logout',userController.logout)

module.exports = router;
