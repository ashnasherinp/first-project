
const User = require('../../models/userSchema'); 
const Cart = require('../../models/cartSchema');  
const Order = require('../../models/orderSchema'); 
const Product = require('../../models/productSchema'); 
const Address = require('../../models/addressSchema');  
const Coupon = require('../../models/coupenSchema');



const getCheckout = async (req, res) => {
    try {
        
        const userId = req.session.user; 
       
        const cart = await Cart.findOne({ userId }).populate('items.productId');  
        const userAddresses = await Address.find({ userId }); 
        const appliedCoupon = req.session.appliedCoupon || null;
       
        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart'); 
        }

        
        const totalPrice = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
        let discount = 0;
        let finalAmount = totalPrice;

        if (appliedCoupon) {
            discount = appliedCoupon.offerPrice || 0; 
            finalAmount = totalPrice - discount; 
        }
        
        res.render('checkout', {
            cart,
            totalPrice, 
            userAddresses,
            appliedCoupon: req.session.coupon, 
            finalAmount,
            discount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch cart and addresses.' });
    }
};

const checkout = async (req, res) => {
    try {
        console.log('Entering checkout function');
 
    
        const userId = req.session.user; 
      

       
        const { addressId, paymentMethod } = req.body;
       
        
        const cart = await Cart.findOne({ userId }).populate('items.productId');
    

        if (!cart || cart.items.length === 0) {
            console.log('Cart is empty');
            return res.status(400).json({ error: 'Cart is empty' });
        }

        
        const totalPrice = cart.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
       
        const coupon = req.session.coupon;     
      
        const discount = 0; 
        if (coupon) {
            discount = coupon.offerPrice;
        }

        const finalAmount = totalPrice - discount;
    
        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) {
            console.log('Invalid or missing address');
            return res.status(400).json({ error: 'Invalid or missing address' });
        }

        const order = new Order({
            orderedItems: cart.items.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.price,
            })),
            totalPrice,
            discount,
            finalAmount,
            address: addressId, 
            invoiceDate: new Date(),
            status: 'Pending', 
            paymentMethod,
            couponApplied:isCouponApplied,
            // userId,
           
        });

        
        await order.save();
        console.log('Order saved successfully:', order._id);

        
        cart.items = [];
        await cart.save();
        console.log('Cart cleared successfully');

        res.redirect(`/orderConfirmation?orderId=${order._id}`);
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: 'Failed to process checkout.' });
    }
};
 

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user;

        const coupon = await Coupon.findOne({ name: couponCode, isList: true });
        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid coupon code" });
        }

        const currentDate = new Date();
        if (coupon.expireOn < currentDate) {
            return res.status(400).json({ success: false, message: "Coupon has expired" });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty" });
        }

        const totalPrice = cart.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

        // Check if total price meets minimum price for the coupon
        if (totalPrice < coupon.minimumPrice) {
            return res.status(400).json({
                success: false,
                message: `Minimum price of ₹${coupon.minimumPrice} required to use this coupon.`
            });
        }

        const discount = coupon.offerPrice;
        const finalAmount = totalPrice - discount;

        req.session.coupon = {
            id: coupon._id,
            name: coupon.name,
            offerPrice: coupon.offerPrice,
        };

        res.status(200).json({
            success: true,
            message: "Coupon applied successfully!",
            finalAmount,
            discount,
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
    }
};


const availableCoupons = async (req, res) => {
    try {
        
        const coupons = await Coupon.find({
            isList: true, 
            expireOn: { $gt: new Date() } 
        });

        
        res.status(200).json({
            success: true,
            coupons: coupons
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching coupons.'
        });
    }
};



  const removeCoupon = (req, res) => {
    try {
      req.session.coupon = null; 
      res.redirect('/checkout');
    } catch (error) {
      console.error('Error removing coupon:', error);
      res.redirect('/pageNotFound');
    }
  };
  

module.exports = {
   
    getCheckout,
    checkout,
    applyCoupon,
    removeCoupon,
    availableCoupons,
};
