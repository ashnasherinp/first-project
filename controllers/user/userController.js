const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema")
const Product = require('../../models/productSchema')
const Brand = require('../../models/brandSchema')
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user
    const categories = await Category.find({isListed:true})
    let productData = await Product.find(
      {isBlocked:false,
        category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
      }
    )
productData.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))
productData = productData.slice(0,4)

    if (user) {
      const userData = await User.findById(user);
      res.locals.users = userData;
      return res.render("home", { user: userData,products:productData });
    } else {
      
      return res.render("home",{products:productData});
    }
  } catch (error) {
    console.log(error.message);
    console.log(error);
    res.status(500).send("server error");
  }
};
const pageNotFound = async (req, res) => {
  try {
    res.render("page-404");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const loadSignup = async (req, res) => {
  try {
    return res.render("signup");
  } catch (error) {
    console.log("home page not loading:", error);
    res.status(500).send("server error");
  }
};



function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "verify your account",
      text: `your OTP is ${otp}`,
      html: `<b>ypur OTP :${otp}</b>`,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("eroor sending email", error);
    return false;
  }
}

const signup = async (req, res) => {
  try {
    const { name, phone, email, password, confirmpassword } = req.body;

    if (password !== confirmpassword) {
      return res.render("signup", { message: "password do not match" });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("signup", { message: "user already exist" });
    }
    const otp = generateOtp();
    const emailsent = await sendVerificationEmail(email, otp);
    if (!emailsent) {
      return res.json("email_error");
    }
    req.session.userOtp = otp;
    req.session.userData = { email, name, phone, password };

    res.render("verify-otp");
    console.log("otp send ", otp);
  } catch (error) {
    console.error("signup error", error);
    res.redirect("/pageNotFound");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {}
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
      });
      await saveUserData.save();
      
      req.session.user = saveUserData._id;
      res.json({ success: true, redirectUrl: "/" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "invalid otp please try again" });
    }
  } catch (error) {
    console.error("error verifiying otp ", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "email not found in session" });
    }
    console.log("User session data:", req.session.userData);

    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailsent = await sendVerificationEmail(email, otp);
    if (emailsent) {
      console.log("resend OTP :", otp);
      res
        .status(200)
        .json({ success: true, message: "otp resend successfully" });
    } else {
      res
        .status(500)
        .json({
          success: false,
          message: "failed to resend otp.please try again  ",
        });
    }
  } catch (error) {
    console.error("error resend otp", error);
    res
      .status(500)
      .json({
        success: false,
        message: "internal server error . please try again",
      });
  }
};

const loadlogin = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("login");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.redirect("pageNotFound");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ isAdmin: 0, email: email });
    if (!findUser) {
      return res.render("login", { message: "user not found" });
    }
    if (findUser.isBlocked) {
      return res.render("login", { message: "user is blocked by admin" });
    }


    

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    
    if (!passwordMatch) {
      return res.render("login", { message: "incorrect password" });
    }
    req.session.user = findUser._id;
    res.redirect("/");
  } catch (error) {
    console.error("login error", error);
    res.render("login", { message: "login failed,please try again" });
  }
};

const logout = async(req,res)=>{
  try {
    req.session.destroy((err)=>{
      if(err){
        console.log("session destruction error",err.message)
        return res.redirect('pageNotFound')
      }
      return res.redirect('/login')
    })
  } catch (error) {
    console.log('logout error',error)
    return res.redirect('pageNotFound')
  }
}


const aboutUs = async (req, res) => {
  try {
    return res.render("aboutUs");
  } catch (error) {
    console.log("aboutUs page not loading:", error);
    res.status(500).send("server error");
  }
};

const loadShoppingPage = async (req, res) => {
  try {
      
      const user = req.session.user;
      const userData = await User.findOne({ _id: user });

     
      const categories = await Category.find({ isListed: true });
      const categoryIds = categories.map((category) => category._id.toString());

      
      const brands = await Brand.find({ isBlocked: false });

     
      const page = parseInt(req.query.page) || 1;
      const limit = 8;
      const skip = (page - 1) * limit;

     
      let filter = {
          isBlocked: false,
          category: { $in: categoryIds },
          parent: null ,
      };

     
      if (req.query.category) {
          filter.category = req.query.category;
      }

      
      if (req.query.brand) {
          filter.brand = req.query.brand;
      }

     
      if (req.query.minPrice || req.query.maxPrice) {
          filter.salePrice = {};
          if (req.query.minPrice) {
              filter.salePrice.$gte = parseFloat(req.query.minPrice);
          }
          if (req.query.maxPrice) {
              filter.salePrice.$lte = parseFloat(req.query.maxPrice);
          }
      }

      let sortOption = { createdAt: -1 }; 

      if (req.query.sort) {
          if (req.query.sort === 'lowToHigh') {
              sortOption = { salePrice: 1 }; 
          } else if (req.query.sort === 'HighToLow') {
              sortOption = { salePrice: -1 };
          } else if (req.query.sort === 'atoz') {
              sortOption = { productName: 1 }; 
          } else if (req.query.sort === 'ztoa') {
              sortOption = { productName: -1 }; 
          }
      }

      
      const products = await Product.find(filter)
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean();

   

   
      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / limit);

      const categoriesWithIds = categories.map(category => ({ _id: category._id, name: category.name }));

     
      res.render("shop", {
          user: userData,
          products,
          category: categoriesWithIds,
          brand: brands,
          totalProducts,
          currentPage: page,
          totalPages
      });

  } catch (error) {
      console.error('Error loading shopping page:', error);
      res.redirect("/pageNotFound");
  }
};


// const loadShoppingPage = async(req,res)=>{
//     try {
//          const user = req.session.user
//          const userData = await User.findOne({_id:user})
//          const categories = await Category.find({isListed:true})
//          const categoryIds = categories.map((category)=>category._id.toString())
//          const page = parseInt(req.query.page) || 1
//          const limit = 9
//          const skip = (page-1)*limit
//          const products = await Product.find({
//           isBlocked:false,
//           category:{$in:categoryIds},
//           quantity:{$gt:0},
//          }).sort({createdOn:-1}).skip(skip).limit(limit)

//          const totalProducts = await Product.countDocuments({
//           isBlocked:false,
//           category:{$in:categoryIds},
//           quantity:{$gt:0}
//          })
//          const totalPages = Math.ceil(totalProducts/limit)
//          const brands = await Brand.find({isBlocked:false})
//          const categoriesWithIds = categories.map((category)=>({_id:category._id,name:category.name}))

        

//          res.render('shop',{
//           user:res.locals.users,
//           products:products,
//           category:categoriesWithIds,
//           brand:brands,
//           currentPage:page,
//           totalPages:totalPages
          


//          })

//         } catch (error) {
//         console.log('shopping page not loading:',error)
//         res.status(500).send('server error')

//         res.redirect('/pageNotFound')
//     }
// }



// const filterProduct = async(req,res)=>{
//   try {
  
//     const user = req.session.user
    
//     const category = req.query.category
//     const brand = req.query.brand
//     const findCategory = category ? await Category.findOne({_id:category}) : null;
  
//     const findBrand = brand ? await Brand.findOne({_id:brand}) : null;
//     const brands = await Brand.find({}).lean()
//     const query ={
//       isBlocked:false,
//       quantity:{$gt:0}
//     }
//     if(findCategory){
//       query.category = findCategory._id

//     }
//     if(findBrand){
//       query.brand = findBrand.brandName
//     }

//     let findProducts = await Product.find(query).lean()
//     findProducts.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))
    
  
//     const categories = await Category.find({isListed:true})

//     let itemsPerPage =6
//     let currentPage = parseInt(req.query.page) || 1
//     let startIndex = (currentPage-1)*itemsPerPage
//     let endIndex = startIndex + itemsPerPage
//     let totalPages = Math.ceil(findProducts.length/itemsPerPage)
//     const currentProduct = findProducts.slice(startIndex,endIndex)
//    let userData = null
//    if(user){
//     userData = await User.findOne({_id:user})
//     if(userData){
//       const searchEntry ={
//         category : findCategory ? findCategory._id:null,
//         brand : findBrand ? findBrand._id:null,
//         searchedOn : new Date()

//       }
//       userData.searchHistory.push(searchEntry)
//       await userData.save()
//     }
//    }
   
//    req.session.filteredProducts = currentProduct
//    res.render('shop',{
//     user:userData,
//     products:currentProduct,
//     category:categories,
//     brand:brands,
//     totalPages,
//     currentPage,
//     selectedCategory:category || null,
//     selectedBrand : brand || null,
//    })

//   } catch (error) {
//     console.error('Error in filterProduct:', error);
//     res.redirect("/pageNotFound")
//   }
// }

// const filterByPrice = async(req,res)=>{
//   try {
//     const user = req.session.user
//     const userData = await User.findOne({_id:user})
//     const brands = await Brand.find({}).lean()
//     const categories = await Category.find({isListed:true}).lean()

//     let findProducts = await Product.find({
//       salePrice:{$gt:req.query.gt,$lt:req.query.lt},
//       isBlocked:false,
//       quantity:{$gt:0}
//     }).lean()

//     findProducts.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))
    
//     let itemsPerPage =6
//     let currentPage = parseInt(req.query.page) || 1
//     let startIndex = (currentPage-1)*itemsPerPage
//     let endIndex = startIndex + itemsPerPage
//     let totalPages = Math.ceil(findProducts.length/itemsPerPage)
//     const currentProduct = findProducts.slice(startIndex,endIndex)
//    req.session.filteredProducts = findProducts

//    res.render('shop',{
//     user:userData,
//     products:currentProduct,
//     category:categories,
//     brand:brands,
//     totalPages,
//     currentPage,
    
//    })
//   } catch (error) {
//     console.log(error)
//     res.redirect("/pageNotFound")
//   }
// }


const searchProducts = async(req,res)=>{
  try {
    const user = req.session.user
    const userData = await User.findOne({_id:user})
    let search = req.body.query

    const brands = await Brand.find({}).lean()
    const categories = await Category.find({isListed:true}).lean()
    const categoryIds = categories.map(category=>category._id.toString())
    let searchResult =[]
    if(req.session.filteredProducts && req.session.filteredProducts.length>0){
      searchResult = req.session.filteredProducts.filter(product=>
        product.productName.toLowerCase().includes(search.toLowerCase())
      )
    }else{
      searchResult = await Product.find({
        productName:{$regex:'.*'+search+".*",$options:"i"},
        isBlocked :false,
        quantity:{$gt:0},
        category:{$in:categoryIds}
      })
    }
   searchResult.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))
   let itemsPerPage =6
   let currentPage = parseInt(req.query.page) || 1
   let startIndex = (currentPage-1)*itemsPerPage
   let endIndex = startIndex + itemsPerPage
   let totalPages = Math.ceil(searchResult.length/itemsPerPage)
   const currentProduct = searchResult.slice(startIndex,endIndex)

   res.render('shop',{
    user:userData,
    products:currentProduct,
    category:categories,
    brand:brands,
    totalPages,
    currentPage,
    count:searchResult.length,
    
   })

  } catch (error) {
    console.log(error)
    res.redirect("/pageNotFound")
  }
}





module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignup,
  signup,
  verifyOtp,
  resendOtp,
  loadlogin,
  login,
  logout,
  loadShoppingPage,
  // filterProduct,
  // filterByPrice,
  searchProducts,
  aboutUs,
};
