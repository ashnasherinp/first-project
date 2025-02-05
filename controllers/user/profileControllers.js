const User = require("../../models/userSchema")
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema');
const Wallet = require('../../models/walletSchema');
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require("dotenv").config()
const session = require ('express-session')




function generateOtp(){
    const digits ="1234567890"
    let otp =""
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)]

    }
    return otp
}

const sendVerificationEmail=async(email,otp)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            secure:587,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,


            }
          
        })
        const mailOptions ={
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject :"your OTP for password reset",
            text :`Your OTP is ${otp}`,
            html:`<b><h4>your OTP :${otp}</h4><br></br>`
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("Email sent :",info.messageId)
        return true;
    } catch (error) {
        console.error("error sending email",error)
        return fasle
    }
}


const securePassword = async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }
}

const getForgotPassPage = async(req,res)=>{
    try {
        res.render('forgot-password')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const forgotEmailValid = async (req,res)=>{
    try {
        const {email} = req.body
        const findUser = await User.findOne({email:email})
        if(findUser){
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email,otp)
            if(emailSent){
                req.session.userOtp = otp
                req.session.email = email
                res.render('forgotPass-otp')
                console.log('OTP:',otp)
            }else{
                res.json({success:false,message:'Failed to send OTP.Please try again'})
            }

        }else{
            res.render('forgot-password',{
                message:"User with this email does not exist"
            })
        }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}


const verifyForgotPassOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp
        console.log(enteredOtp)
        if(enteredOtp === req.session.userOtp){
            res.json({success:true,redirectUrl:'/reset-password'})
        }else{
            res.json({success:false,message:'otp not matching'})
        }

    } catch (error) {
        res.status(500).json({success:false,message:'an error occured .Please try again'})
    }
}

const getResetPassPage = async(req,res)=>{
    try {
        res.render('reset-password')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const resendOtp = async(req,res)=>{
    try {
        const otp = generateOtp()
        req.session.userOtp = otp
        const email = req.session.email
        console.log('resending otp to email:',email)
        const emailSent = await sendVerificationEmail(email,otp)
        if(emailSent){
            console.log('Resend OTP :',otp)
            res.status(200).json({success:true,message:'Resned OTP Successful'})
        }
    } catch (error) {
        console.error('Error in resend otp ',error)
        res.status(500).json({success:false,message:'Internal Server Error'})
    }
}

const postNewPassword= async(req,res)=>{
    try {
        const{newPass1,newPass2} = req.body
        const email = req.session.email
        if(newPass1===newPass2){
            const passwordHash = await securePassword(newPass1)
            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            )
            res.redirect('/login')

        }else{
            res.render('reset-password',{message:'Password do not match'})
        }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const userProfile = async (req,res)=>{
    try {
        const userId = req.session.user
        const userData = await User.findById(userId)
        const addressData = await Address.findOne({userId: userId})
        const wallet = await Wallet.findOne({ userId: userId });
   
    const orders = await Order.find({ user: userId })
      .sort({ createdOn: -1 })  
      
        res.render('profile',{
            user:userData,
            userAddress :addressData,
            orders: orders,
            wallet,
            
        })
    } catch (error) {
        console.error('Error for retrieve data',error)
        res.redirect('/pageNotFound')
    }
}

const changeEmail = async(req,res)=>{
    try {
        res.render('change-email')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

 const changeEmailValid = async(req,res)=>{
    try {
        const {email} = req.body
        const userExists =  await User.findOne({email})
        if(userExists){
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email,otp)
            if(emailSent){
                req.session.userOtp = otp
                req.session.userData = req.body
                req.session.email = email
                res.render('change-email-otp')
                console.log('Email send :',email)
                console.log('otp :',otp)
            }else{
                res.json('email-error')

            }
        }else{
            res.render('change-email',{
                message :'User with this email not exist'
            })
        }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
 }

 const verifyEmailOtp = async(req,res)=>{
    try {
        const enteredOtp =req.body.otp
        if(enteredOtp === req.session.userOtp){
            req.session.userData = req.body.userData
            res.render('new-email',{
                message:'otp not matching',
                userData : req.session.userData
            })
        }else{
            res.render('change-email-otp',{
                message:'otp not matching',
                userData : req.session.userData
            })
        }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
 }

 const updateEmail = async(req,res)=>{
    try {
        const newEmail = req.body.newEmail
        const userId = req.session.user
        await User.findByIdAndUpdate(userId,{email:newEmail})
        res.redirect('/userProfile')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
 }

 const changePassword = async(req,res)=>{
    try {
        res.render('change-password')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
 }

 const changePasswordValid = async(req,res)=>{
    try {
        const {email} = req.body
        const userExists = await User.findOne({email})
        if(userExists){
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email,otp)
            if(emailSent){
                req.session.userOtp = otp
                req.session.userData = req.body
                req.session.email= email
                res.render('change-password-otp')
                console.log('otp:',otp)

            }else{
                res.json({
                    success:false,
                    message:'Failed to send OTP. please try again',
                })
            }
        }else{
            res.render('change-password',{
                message:'User with this email does not exist'
            })
        }
    } catch (error) {
        console.log('Error in change password validation',error)
        res.redirect('/pageNotFound')
    }
 }


 const verifyChangePassOtp = async(req,res)=>{
    try {
        const enteredOtp =req.body.otp
        if(enteredOtp === req.session.userOtp){
            res.json({success:true,redirectUrl:"/reset-password"})
        }else{
            res.json({success:false,message:'OTP not matching'})
        }
    } catch (error) {
        res.status(500).json({success:false,message:'An error occured.please try again later'})
    }
 }



const addAddress = async(req,res)=>{
    try {
        
        const user = req.session.user;
        res.render("add-address",{user:user});

    } catch (error) {
        
        res.redirect("/pageNotFound");

    }
}


const postAddAddress = async(req,res)=>{
    try {
    
        const userId = req.session.user;
        const userData = await User.findOne({_id:userId});
        console.log(userData)
        const {addressType,name,city,landMark,state,pincode,phone,altPhone} = req.body;

        const userAddress = await Address.findOne({userId:userData._id});
      

        if(!userAddress){
             
            const newAddress = new Address({

               userId : userData._id,
               address : [{addressType,name,city,landMark,state,pincode,phone,altPhone}],              

            });
            await newAddress.save();
        }else{

            userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone});
            await userAddress.save();
        }
        res.redirect("/userProfile");

    } catch (error) {
        
       console.error("Error adding address ",error);
       res.redirect("/pageNotFound");

    }
}

const editAddress = async(req,res)=>{
    try {
      
        const addressId = req.query.id
    
        const user = req.session.user
        const currAddress = await Address.findOne({
            "address._id" : addressId,
        })
        if(!currAddress){
            return res.redirect('/pageNotFound')
        }

        const addressData = currAddress.address.find((item)=>{
            return item._id.toString()===addressId.toString()
        })

        if(!addressData){
            return res.redirect('/pageNotFound')
        }

        res.render('edit-address',{address:addressData,user:user})
    } catch (error) {
        console.error('Error in edit address',error)
         res.redirect('/pageNotFound')
    }
}

const PostEditAddress = async(req,res)=>{
    try {
        const data = req.body
        const addressId = req.query.id
        const user = req.session.user
        const findAddress = await Address.findOne({"address._id":addressId})
        if(!findAddress){
            res.redirect('/pageNotFound')
        }
        await Address.updateOne(
            {"address._id":addressId},
            {$set:{
                "address.$":{
                    _id : addressId,
                    addressType:data.addressType,
                    name:data.name,
                    city:data.city,
                    landMark:data.landMark,
                    state:data.state,
                    pincode:data.pincode,
                    phone:data.phone,
                    altPhone :data.altPhone,
                }
            }}
        )
        res.redirect('/userProfile')

    } catch (error) {
        console.error('Error in edit address',error)
        res.redirect('/pageNotFound')
    }
}


const deleteAddress = async(req,res)=>{
    try {
        const addressId = req.query.id
        const findAddress = await Address.findOne({"address._id":addressId})
        if(!findAddress){
            return res.status(404).send("Address not found")
        }

        await Address.updateOne({
            "address._id":addressId
        },
    {
        $pull:{
            address :{
                _id : addressId,
            }
        }
    }
)

res.redirect('/userProfile')
    } catch (error) {
        console.error('Error in delete address',error)
        res.redirect('/pageNotFound')
    }
}





const cancelOrder = async (req, res) => {
    try {
      const orderId = req.params.orderId;
   
      const order = await Order.findById(orderId).populate('orderedItems.product');

      if (!order) {
        return res.status(404).send('Order not found');
      }
      if (['Shipped', 'Delivered'].includes(order.status)) {
        return res.status(400).send('Order cannot be cancelled as it is already shipped or delivered');
      }
  
      
      order.status = 'Cancelled';
      
      for (let item of order.orderedItems) {
        const product = item.product;
        product.quantity += item.quantity;
        await product.save(); 
      }
      
      await order.save()

     
    let refundAmount = 0;
    
 
  if ((order.paymentMethod === 'Wallet' || order.paymentMethod === 'Razorpay')&&order.paymentStatus==='Paid') {
    let wallet = await Wallet.findOne({ userId: order.user });
    
   
    if (!wallet) {
      wallet = new Wallet({ userId: order.user });
    }

   
    refundAmount = order.totalPrice;

    wallet.balance += refundAmount;  
 

   
    wallet.transactionHistory.push({
      transactionType: 'refund',
      transactionAmount: refundAmount,
      description: `Refund for canceled order: ${order.orderId}`,
    });

    await wallet.save(); 
  }


    res.json({
      success: true,
      refundAmount,
      message: `Order cancelled successfully. Refund of ₹${refundAmount} has been credited to your wallet.`,
    });
   
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };

  const viewOrder = async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId)
      .populate('orderedItems.product');
 
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
      res.render('order-view', { order: order });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };

  const returnProduct = async (req, res) => {
    try {
      const { orderId, productId } = req.params;
      const { reason } = req.body;
  
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
    
      if (order.status !== 'Delivered') {
        return res.status(400).send('Only delivered orders can be returned');
      }
  
     
      const productIndex = order.orderedItems.findIndex(
        (item) => item.product.toString() === productId
      );
      if (productIndex === -1) {
        return res.status(404).send('Product not found in this order');
      }
  
      const product = order.orderedItems[productIndex];
  
     
      if (product.status === 'Return Requested' || product.status === 'Returned') {
        return res.status(400).send('Product has already been requested for return');
      }
  
      product.returnReason = reason;
      product.status = 'Return Requested';
      product.returnDate = null;
  
     
      await order.save();
  
      res.redirect(`/view-order/${orderId}?returnRequested=true`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };
  

module.exports = {
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    userProfile,
    changeEmail,
    changeEmailValid,
    verifyEmailOtp,
    updateEmail,
    changePassword,
    changePasswordValid,
    verifyChangePassOtp,
    addAddress,
    postAddAddress ,
    editAddress,
    PostEditAddress,
    deleteAddress,
    cancelOrder,
    viewOrder,
    returnProduct,
    
}