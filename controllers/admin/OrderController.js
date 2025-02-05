
const Order = require('../../models/orderSchema'); 



const listOrders = (req, res) => {
  Order.find()
    .populate('user') 
    .populate('orderedItems.product')
    .then(orders => {
      res.render('orderList', { orders });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error fetching orders');
    });
};



const viewOrder = (req, res) => {
  const { orderId } = req.params;
  Order.findById(orderId)
    .populate('user')
    .populate('orderedItems.product')
    .then(order => {
      if (!order) {
        return res.status(404).send('Order not found');
      }

      
      res.render('viewOrder', { 
        order,
        address: order.address, 
        couponApplied: order.couponApplied,  
        couponCode: order.couponCode, 
        couponDiscount: order.discount
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error fetching the order');
    });
};



const changeOrderStatus = (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; 

  Order.findByIdAndUpdate(orderId, { status }, { new: true })
    .then(order => {
      res.redirect('/admin/orderList'); 
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error updating order status');
    });
};


const cancelOrder = (req, res) => {
  const { orderId } = req.params;

  Order.findByIdAndUpdate(orderId, { status: 'Cancelled' }, { new: true })
    .then(order => {
      res.redirect('/admin/orderList'); 
    })
   
    .catch(err => {
      console.error(err);
      res.status(500).send('Error cancelling the order');
    });
};



const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params; 
  const { status } = req.body; 

  try {

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

   
    order.status = status;
    await order.save();
    res.redirect('/admin/orderList');
   
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const approveReturn = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

 
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).send('Order not found');
    }

  
    const item = order.orderedItems.find(item => item.product.toString() === productId);

    if (!item) {
      return res.status(404).send('Product not found in this order');
    }

    item.status = 'Returned';
   
    await order.save();

    
    res.redirect('/admin/orderList'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


const rejectReturn = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

  
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send('Order not found');
    }

   
    const item = order.orderedItems.find(item => item.product.toString() === productId);

    if (!item) {
      return res.status(404).send('Product not found in this order');
    }

  
    item.status = 'Return Rejected';
    
    await order.save();
    res.redirect('/admin/orderList'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};






module.exports ={
    listOrders ,
    viewOrder,
    changeOrderStatus ,
    cancelOrder,
    updateOrderStatus,
    approveReturn,
    rejectReturn 
   
}