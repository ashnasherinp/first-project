const User = require('../../models/userSchema')
const Product = require("../../models/productSchema")





const loadWishlist = async(req,res)=>{
    try {
        const userId = req.session.user
        const user =await User.findById(userId)
        const products = await Product.find({_id:{$in:user.wishlist}}).populate('category')

        res.render('wishlist',{
            user,
            wishlist:products,
        })
    } catch (error) {
        console.error(error)
        res.redirect('/PageNotFound')
    }
}

const addToWishlist = async(req,res)=>{
    try {
       const productId =req.body.productId
    //    console.log('hey')
    //    console.log(productId)
       const userId = req.session.user
       const user =await User.findById(userId)
    // const user = await User.findById(userId).populate('wishlist'); 
       if(user.wishlist.includes(productId)){
        return res
        .status(200)
        .json({status:false,message:'product already in wishlist'})
       }
       user.wishlist.push(productId)
       await user.save()
       return res.status(200).json({status:true,message:'Product added to wishlist'})

    } catch (error) {
        console.error(error)
        return res.status(500).json({status:false,message:'server error'})
}
}



// const addToWishlist = async (req, res) => {
//     try {
//       const { productId, size } = req.body; // Extract both productId and size
//       const userId = req.session.user; // Get the user's ID from the session
  
//       if (!userId) {
//         return res.status(401).json({ status: false, message: 'User not authenticated' });
//       }
  
//       // Find the user
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ status: false, message: 'User not found' });
//       }
  
//       // Find the product with the specified productId and size
//       const product = await Product.findOne({ _id: productId, size: size });
//       if (!product) {
//         return res.status(404).json({ status: false, message: 'Product not found with the given size' });
//       }
  
//       // Check if the product (by productId and size) is already in the user's wishlist
//       const alreadyInWishlist = user.wishlist.some(
//         (item) => item.product.toString() === product._id.toString() && item.size === size
//       );
  
//       if (alreadyInWishlist) {
//         return res.status(200).json({ status: false, message: 'Product is already in wishlist' });
//       }
  
//       // Add the product to the user's wishlist
//       user.wishlist.push({
//         product: product._id,
//         size: size,
//         price: product.salePrice, // Use the product's salePrice
//       });
  
//       await user.save();
//       return res.status(200).json({ status: true, message: 'Product added to wishlist' });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ status: false, message: 'Server error' });
//     }
//   };
  

const removeProduct = async(req,res)=>{
    try {
        const productId =req.body.productId
        //    console.log('hey')
        //    console.log(productId)
           const userId = req.session.user
           const user =await User.findById(userId)
           const index=user.wishlist.indexOf(productId)
           user.wishlist.splice(index,1)
           await user.save()
           return res.redirect('/wishlist')

        } catch (error) {
        console.error(error)
        return res.status(500).json({status:false,message:"Server error"})
    }
}

module.exports ={
    loadWishlist,
    addToWishlist,
    removeProduct,
}





