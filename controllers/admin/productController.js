const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const Brand = require('../../models/brandSchema')
const User = require('../../models/userSchema')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')


const getProductAddPage = async(req,res)=>{
    try {
        const category = await Category.find({isListed:true})
        const brand = await Brand.find({isBlocked:false});
        const products = await Product.find({isBlocked:false})
        res.render("product-add",{
            cat:category,
            brand:brand,
            product:products,
        })
    } catch (error) {
        res.redirect('/pageerror')
    }
}

const addProducts = async(req,res)=>{
   
    try {
        const products= req.body
        const productExists = await Product.findOne({
            productName:products.productName,
             
        })

        if(!productExists){
            const images = []
            if(req.files && req.files.length>0){
                for(let i=0;i<req.files.length;i++){
                     const originalImagePath = req.files[i].path

                     const resizedImagePath = path.join('public','uploads','product-images',req.files[i].filename)
                     await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath)
                     images.push(req.files[i].filename)
                }
            }
             const categoryId = await Category.findOne({name:products.category})
             if(!categoryId){
                return res.status(400).join('invalid category name')

             }

             const parentValue = products.parent && products.parent !== "" ? products.parent : null;

               const newProduct = new Product({
                productName:products.productName,
                description:products.description,
                brand:products.brand,
                category:categoryId._id,
                regularPrice:products.regularPrice,
                salePrice :products.salePrice,
                createdOn:new Date(),
                quantity:products.quantity,
                   parent: parentValue,
                size:products.size,
                productImage:images,
                status:'Available',

               })

               await newProduct.save()
               return res.redirect('/admin/addProducts')
        }else{
           return res.status(400).json('Product already exist .please try with another name') 
        }
    } catch (error) {
        console.error('error saving product',error)
        return res.redirect('admin/pageerror')
    }

}



const getAllProducts = async(req,res)=>{

    try {
        const search = req.query.search || ""
        const page = parseInt(req.query.page) || 1
        const limit = 4
        const productData = await Product.find({
            $or:[
                {productName :{$regex:new RegExp('.*'+search+".*","i")}},
                {brand :{$regex:new RegExp('.*'+search+".*","i")}},

            ],
        }).limit(limit*1).skip((page - 1) * limit)
        .populate('category').exec();

        const count = await  Product.find({
            $or:[
                {productName :{$regex:new RegExp('.*'+search+".*","i")}},
                {brand :{$regex:new RegExp('.*'+search+".*","i")}},

            ],
        }).countDocuments()

        const category = await Category.find({isListed:true})
        const brand = await Brand.find({isBlocked:false})


        if(category && brand){
            res.render('products',{
                data:productData,
                currentPage:page,
                totalPages:Math.ceil(count/limit),
                cat:category,
                brand:brand,
            })
        }else{
            res.render('page-404')
        }
    } catch (error) {
        console.error("Error in getAllProducts:", error);
        res.redirect('/pageerror')
    }
}
const addProductOffer = async(req, res) => {
    try {
        const { productId, percentage } = req.body;
        const findProduct = await Product.findOne({ _id: productId });
        const findCategory = await Category.findOne({ _id: findProduct.category });

        if (findCategory.categoryOffer > percentage) {
            return res.json({ status: false, message: "This product's category already has a category offer" });
        }

       
        findProduct.salePrice -= Math.floor(findProduct.salePrice * (percentage / 100));
        findProduct.productOffer = parseInt(percentage);
        await findProduct.save();

      
        findCategory.categoryOffer = 0;
        await findCategory.save();

        res.json({ status: true });
    } catch (error) {
        res.redirect('/pageerror');
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;
        const findProduct = await Product.findOne({ _id: productId });

      
        findProduct.salePrice = findProduct.regularPrice;
        findProduct.productOffer = 0; 
        await findProduct.save();

        res.json({ status: true });
    } catch (error) {
        res.redirect('/pageerror');
    }
};
const blockProduct = async(req,res)=>{
    try {
        let id =req.query.id
        await Product.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect("/admin/products")
    } catch (error) {
        res.redirect('/pageerror')
    }
}


const unblockProduct =async(req,res)=>{
    try {
        let id =req.query.id
        await Product.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect("/admin/products")
    } catch (error) {
        res.redirect('/pageerror')
    }
}

const getEditProduct = async(req,res)=>{
    try {
        const id = req.query.id
       

        const product = await Product.findOne({_id:id})
        const category = await Category.find({})
       
        const brand = await Brand.find({})
        const productList = await Product.find({}); 

        res.render('edit-product',{
            product :product,
            cat :category,
            brand:brand,
            productList: productList,
            size:product.size,

        })

    } catch (error) {
        res.redirect('/pageerror')
    }
}

const editProduct = async (req, res) => {
    try {
      const id = req.params.id; 
  
      const data = req.body; 
  
      
      const existingProduct = await Product.findOne({
        productName: data.productName,
        _id: { $ne: id },
      });
      if (existingProduct) {
        return res.status(400).json({
          error: "Product with this name already exists. Please try with another name.",
        });
      }
  
      const category = await Category.findOne({ name: data.category });
      if (!category) {
        return res.status(400).json({ error: "Invalid category name." });
      }
  
      
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          images.push(req.files[i].filename);
        }
      }
     
      
      const parentValue = data.parent && data.parent !== "" ? data.parent : null;
  
      const updateFields = {
        productName: data.productName,
        description: data.descriptionData, 
        brand: data.brand,
        category: category._id,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        quantity: data.quantity,
        parent: parentValue,
        size: data.size,
      };
      
      if (images.length > 0) {
        await Product.findByIdAndUpdate(
          id,
          {
            $set: updateFields,
            $push: { productImage: { $each: images } },
          },
          { new: true }
        );
      } else {
        await Product.findByIdAndUpdate(id, updateFields, { new: true });
      }
  
      console.log("Product successfully updated!");
      res.redirect("/admin/products");
    } catch (error) {
      console.error("Error in editProduct:", error.message, error.stack);
      res.redirect("/pageerror");
    }
  };
  
  
const deleteSingleImage = async (req,res)=>{
    try {
        const{imageNameToServer,productIdToServer} = req.body
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}})
        const imagePath = path.join("public","uploads","re-image",imageNameToServer)
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath)
            console.log(`image ${imageNameToServer} deleted succesfully`)
        }else{
            console.log(`image ${imageNameToServer} not found`)
        }
        res.send({status:true})
    } catch (error) {
        res.redirect('/pageerror')
    }
}

module.exports ={
    getProductAddPage,
    addProducts,
    getAllProducts,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,

}