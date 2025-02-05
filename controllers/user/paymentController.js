
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Order = require('../../models/orderSchema'); 
const Address = require('../../models/addressSchema'); 
const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')
const Coupon = require('../../models/coupenSchema');  

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const createPayment = async (req, res) => {
    try {
      const { addressId, cartItems, paymentMethod,totalPrice,couponCode  } = req.body;
      const userId = req.session.user;
  
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }
  
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
  
      const userAddress = await Address.findOne({
        userId: req.session.user,
        "address._id": addressId,
      });
  
      if (!userAddress) {
        return res.status(400).json({ success: false, message: "Invalid address" });
      }
  
      const selectedAddress = userAddress.address.find(item => item._id.toString() === addressId);
      if (!selectedAddress) {
        return res.status(400).json({ success: false, message: "Address not found" });
      }
  
    
      for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        if (!product || product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product: ${product?.productName || item.productId}`,
          });
        }
      }
  
    
      for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        product.quantity -= item.quantity;
        await product.save();
      }
  
    
      let discountAmount = 0;
      let finalAmount = totalPrice;
      if (couponCode) {
        const coupon = await Coupon.findOne({ name: couponCode, isList: true });
        if (coupon) {
          discountAmount = coupon.offerPrice;
          finalAmount -= discountAmount;
        }
      }
      const orderReceiptId = `order_${Date.now()}`;
  
 
     
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: totalPrice * 100 ,
        currency: "INR",
        receipt: orderReceiptId,
      });
   
      
       const newOrder = new Order({
        user: userId,
        address: selectedAddress,
        orderedItems: cartItems.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalPrice,
        paymentMethod,
        createdOn: new Date(),
        orderId: razorpayOrder.id,
        paymentStatus:"Pending",
        discount : discountAmount,
        couponApplied: Boolean(couponCode),
        couponCode: couponCode || null
      });

      await newOrder.save();
  
      const cart = await Cart.findOne({ userId: req.session.user });
      if (cart) {
        cart.items = [];
        await cart.save();
      }

     return res.status(200).json({
        success: true,
        razorpayOrderId: razorpayOrder.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
      });
    } catch (error) {
      console.error("Error creating payment order:", error);
     return res.status(500).json({ success: false, message: "Failed to create payment order" });
    }
  };
  


const verifyPayment = async (req, res) => {

  try {
    const { razorpayOrderId, paymentId, razorpaySignature } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${paymentId}`);
    const generatedSignature = hmac.digest("hex");


    if (generatedSignature === razorpaySignature) {
 

      const val =await Order.updateOne(
        { orderId: razorpayOrderId },
        { $set: { paymentStatus: "Paid", paymentId: paymentId } }
      );


     res.status(200).json({ success: true, message: "Payment verified",orderId: razorpayOrderId });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" }); 
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};


const recreatePayment = async (req, res) => {
  const { orderId } = req.params; 

  
  try {

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }


    if (order.paymentStatus !== "Pending") {
      return res.status(400).json({ success: false, message: "Payment already processed" });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.totalPrice * 100, 
      currency: "INR",
      receipt: order.orderId, 
    });

    if (razorpayOrder.status === "created") {
      return res.status(200).json({
        success: true,
        razorpayOrderId: order.orderId,                   
        razorpayKey: process.env.RAZORPAY_KEY_ID, 
      });
    } else {
      return res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
    }

  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({ success: false, message: "Error creating payment" });
  }
};




module.exports = { createPayment, verifyPayment, recreatePayment };