const Cart = require('../../models/cartSchema');
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    
    if (!quantity || isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'invalidQuantity', message: 'Invalid quantity.' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'productNotFound', message: 'Product not found.' });
    }

   
    if (quantity > product.quantity) {
      return res.status(400).json({
        error: 'insufficientStock',
        message: `Only ${product.quantity} item(s) left in stock.`,
      });
    }

   
    const userId = req.session.user;

    if (!userId) {
      return res.status(401).json({ error: 'userNotAuthenticated', message: 'User not authenticated.' });
    }

 
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

  
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString() 
    );

    if (existingItemIndex >= 0) {
      return res.status(400).json({
        error: 'alreadyInCart',
        message: 'Product is already in the cart.',
      });
    }

    const maxQuantityPerPerson = 10;
    if (quantity > maxQuantityPerPerson) {
      return res.status(400).json({
        error: 'maxQuantityExceeded',
        message: `You can only add up to ${maxQuantityPerPerson} items of this product.`,
      });
    }

    cart.items.push({
      productId,
      quantity,
      price: product.salePrice,
      totalPrice: product.salePrice * quantity,
    });

    await cart.save();
    res.status(200).json({ message: 'Product added to cart successfully.' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'serverError', message: 'Failed to add product to cart.' });
  }
};





const getCart = async (req, res) => {
    try {
        const userId = req.session.user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }

        const cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ status: false, message: 'Cart not found' });
        }
 

 
        res.render('cart', { cart });
    } catch (err) {
        console.error(err);
        console.log(err)
        res.status(500).json({ status: false, message: 'Server error' });
    }
};


const removeProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user
        const user = await User.findById(userId);
     
        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }

        const cart = await Cart.findOne({ userId: user._id });
        if (!cart) {
            return res.status(404).json({ status: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        await cart.save();

        res.json({ status: true, message: 'Product removed from cart successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Server error' });
    }
};

const updateCartQuantity = async (req, res) => {
  try {
      const { productId, change } = req.body;
      const userId = req.session.user;

      if (!userId) {
          return res.status(401).json({ error: 'userNotAuthenticated', message: 'User not authenticated.' });
      }

      const cart = await Cart.findOne({ userId });

      if (!cart) {
          return res.status(404).json({ error: 'cartNotFound', message: 'Cart not found.' });
      }

      const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

      if (itemIndex < 0) {
          return res.status(404).json({ error: 'itemNotFound', message: 'Product not found in cart.' });
      }

      const item = cart.items[itemIndex];

    
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ error: 'productNotFound', message: 'Product not found.' });
      }

   
      const numericChange = parseInt(change, 10);
      if (isNaN(numericChange)) {
          return res.status(400).json({ error: 'invalidChange', message: 'Invalid quantity change.' });
      }

      const newQuantity = item.quantity + numericChange;

      if (newQuantity > product.stock) {
          return res.status(400).json({
              error: 'insufficientStock',
              message: `Only ${product.stock} items left in stock.`,
          });
      }

      if (newQuantity < 1) {
          return res.status(400).json({
              error: 'invalidQuantity',
              message: 'Quantity cannot be less than 1.',
          });
      }

    
      item.quantity = newQuantity;
      item.totalPrice = item.quantity * item.price;

      await cart.save();

      res.status(200).json({ message: 'Cart updated successfully.' });
  } catch (error) {
      console.error('Error updating cart quantity:', error);
      res.status(500).json({ error: 'serverError', message: 'Failed to update cart.' });
  }
};




module.exports = {
    addToCart,
    getCart,
    removeProduct,
    updateCartQuantity,
};
