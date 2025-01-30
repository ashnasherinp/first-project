const Address = require('../../models/addressSchema');  

const addAddressForOrder = async (req, res) => {
  try {
    const userId = req.session.user;  
    const {
      addressType,
      name,
      street,
      landMark,
      city,
      state,
      pincode,
      phone,
      altPhone
    } = req.body;

    
    const newAddress = {
      addressType,
      name,
      street,
      landMark,
      city,
      state,
      pincode,
      phone,
      altPhone
    };

    
    let userAddress = await Address.findOne({ userId });
    if (!userAddress) {
      userAddress = new Address({ userId, address: [newAddress] });
    } else {
      userAddress.address.push(newAddress);
    }

  
    await userAddress.save();

    res.redirect('/checkout');
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  addAddressForOrder
};
