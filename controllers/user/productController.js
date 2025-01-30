const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema")
const Product = require('../../models/productSchema')
const Brand = require('../../models/brandSchema')

const productDetails = async(req,res)=>{
    try {
        const userId = req.session.user
        const userData = await User.findById(userId)
        const productId = req.query.id

        // console.log("req.query:", req.query);
        // console.log(productId);
        
        const product = await Product.findById(productId).populate('category')
        const findCategory = product.category
        const categoryOffer = findCategory?.categoryOffer || 0
        // console.log(categoryOffer)
        const productOffer = product.productOffer || 0
        // console.log(productOffer)
        const totalOffer = categoryOffer+productOffer
        // console.log(totalOffer)
        
        let offerPercentage = 0;
        if (product.regularPrice > 0 && product.salePrice < product.regularPrice) {
            offerPercentage = ((product.regularPrice - product.salePrice) / product.regularPrice) * 100;
        } 


       
    const relatedProducts = await Product.find({
        category: findCategory._id, 
        _id: { $ne: productId } 
      }).limit(4); 
      const variants = await Product.find({parent:productId});
      console.log(variants,"variants")
        res.render("product-details",{
            user:userData,
            product:product,
            quantity:product.quantity,
            totalOffer :totalOffer,
            category:findCategory,
            offerPercentage: offerPercentage.toFixed(1),
            relatedProducts: relatedProducts,
            variants
            
        })
    } catch (error) {
        console.error('Error for fetching product details',error)
        res.redirect('/pageNotFound')
    }
}









module.exports ={
    productDetails,
}