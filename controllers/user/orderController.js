

const Order = require('../../models/orderSchema'); 
const Address = require('../../models/addressSchema'); 
const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')
const Wallet = require('../../models/walletSchema');
const Coupon = require('../../models/coupenSchema');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid')

const { createPayment } = require('../../controllers/user/paymentController');

const placeOrder = async (req, res) => {
  console.log("Received Order Request:", req.body);

  try {
    const { addressId, cartItems, paymentMethod, couponCode } = req.body;
    const userId = req.session.user;
    console.log(couponCode,'couponcode')

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    let totalPrice = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const userAddress = await Address.findOne({
      userId,
      "address._id": addressId,
    });

    if (!userAddress) {
      return res.status(400).json({ success: false, message: "Invalid address" });
    }

    const selectedAddress = userAddress.address.find((addr) => addr._id.toString() === addressId);
    if (!selectedAddress) {
      return res.status(400).json({ success: false, message: "Address not found" });
    }

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product || product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product?.productName || "Unknown"}`,
        });
      }
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

    if (paymentMethod === "Wallet") {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < finalAmount) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      }
      wallet.balance -= finalAmount;
      wallet.transactionHistory.push({
        transactionType: "debit",
        transactionAmount: finalAmount,
        description: "Purchase using wallet",
      });
      await wallet.save();
    }
    // } else if (paymentMethod === "Razorpay") {
    //   const paymentResponse = await createPayment(req, res); // Assuming this function handles res.json internally
    //   if (!paymentResponse.success) {
    //     return res.status(400).json({ success: false, message: paymentResponse.message });
    //   }
    // }

    const newOrder = new Order({
      user: userId,
      address: selectedAddress,
      orderedItems: cartItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: finalAmount,
      discount: discountAmount,
      paymentMethod,
      createdOn: new Date(),
      orderId: uuidv4(),
      paymentStatus: paymentMethod === "Razorpay" ? "Pending" : "Paid",
      couponApplied: Boolean(couponCode),
      couponCode: couponCode || null
    });

    console.log('Creating order:', newOrder); 
    await newOrder.save();

    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({ success: true, orderId: newOrder.orderId });
  } catch (error) {
    console.error("Error placing order:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Failed to place order." });
    }
  }
};

const orderDetails = async (req, res) => {
    try {
        const { orderId } = req.query; 
        console.log('Order ID:', orderId);
        
        const order = await Order.findOne({ orderId })
        .populate('address')  
        .populate('orderedItems.product');

       
   

    //  const addressID = order.address._id.toString()

    //  const address = await Address.findOne({"address._id":addressID})
        // console.log(address)
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        
        res.render('orderConfirmation', {
            order,
            pageTitle: "Order Confirmation",
            successMessage: "Your order has been placed successfully"
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({ success: false, message: "Error fetching order details" });
    }
};



const downloadOrderPDF = async (req, res) => {
  try {
    const { orderId } = req.params;

   
    const order = await Order.findById(orderId).populate('orderedItems.product').exec();
    if (!order) {
      return res.status(404).send('Order not found');
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Order-${orderId}.pdf`);


    doc.pipe(res);


    doc.fontSize(20).text('Order Confirmation', { align: 'center' }).moveDown(1);

    doc.fontSize(14).text(`Order ID: ${order._id}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Total Price: ₹${order.totalPrice}`);
    doc.text(`Payment Method: ${order.paymentMethod}`).moveDown(1);

    doc.fontSize(16).text('Shipping Address:', { underline: true }).moveDown(0.5);
    doc.fontSize(12)
      .text(`Name: ${order?.address?.name}`)
      .text(`Address Type: ${order?.address?.addressType}`)
      .text(`City: ${order?.address?.city}`)
      .text(`Landmark: ${order?.address?.landMark}`)
      .text(`State: ${order?.address?.state}`)
      .text(`Pincode: ${order?.address?.pincode}`)
      .text(`Phone: ${order?.address?.phone}`)
      .text(`Alternate Phone: ${order?.address?.altPhone || 'N/A'}`)
      .moveDown(1);

    doc.fontSize(16).text('Ordered Items:', { underline: true }).moveDown(0.5);
    order.orderedItems.forEach((item) => {
      doc.fontSize(12)
        .text(`Product: ${item.product.productName}`)
        .text(`Quantity: ${item.quantity}`)
        .text(`Price per item: ₹${item.price}`)
        .text(`Total Price: ₹${item.quantity * item.price}`)
        .moveDown(0.5);
    });

    doc.fontSize(16).text('Order Summary:', { underline: true }).moveDown(0.5);
    doc.fontSize(12).text(`Total Price: ₹${order.totalPrice}`).moveDown(1);

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Failed to generate PDF');
  }
};


module.exports={
    
    placeOrder,
    orderDetails,
    downloadOrderPDF,
}
