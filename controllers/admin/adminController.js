const User = require('../../models/userSchema')
const mongoose = require('mongoose')

const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require("../../models/brandSchema");
    

const bcrypt = require('bcrypt')


const pageerror = async(req,res)=>{
    res.render('admin-error')
}


const loadlogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin/dashboard')

    }
    res.render('admin-login',{message:null})
}

const login = async (req,res)=>{
    try {
        const {email,password} =req.body
        const admin = await User.findOne({email,isAdmin:true})
        if(admin){
            const passwordMatch = await  bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin = true
                return res.redirect('/admin')

            }else{
                return res.redirect('/login')
            }
        } else{
            return res.redirect ('/login')
        }
    } catch (error) {
        console.log("login error",error);
        return res.redirect('/pageerror')
        
    }
}

const loadDashboard = async (req, res) => {
    console.log('hey')
    try {
        // Get total counts for users, products, and orders
        let totalUsers = await User.countDocuments();
        let totalProducts = await Product.countDocuments();
        let totalOrders = await Order.countDocuments({status:"Delivered"});



          // Fetch total sales using the existing aggregation logic (keeping it as is)
        const Sales = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { 
                $group: {
                    _id: null,
                    totalSales: { 
                        $sum: { $cond: [{ $eq: ['$discount', 0] }, '$totalPrice', '$finalAmount'] }
                    }
                }
            }
        ]);

        const totalSales = Sales.length > 0 ? Sales[0].totalSales : 0;

        // Fetch total discounts (no change)
        const discount = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { 
                $group: {
                    _id: null,
                    discount: { $sum: '$discount' }
                }
    }]);
        const totalDiscount = discount.length > 0 ? discount[0].discount : 0;

        // Get recent orders
        const orders = await Order.find({ status: "Delivered" }).sort({ createdOn: -1 });

        const bestSellingProducts = await Order.aggregate([
            { $match: { status: 'Delivered' } }, 
            { $unwind: '$orderedItems' }, 
            {
                $lookup: { 
                    from: 'products',
                    localField: 'orderedItems.product', 
                    foreignField: '_id', 
                    as: 'productDetails'
                }
            },
            {
                $addFields: {
                    'orderedItems.productName': { $arrayElemAt: ['$productDetails.productName', 0] }
                }
            },
            {
                $group: {
                    _id: '$orderedItems.product',
                    productName: { $first: '$orderedItems.productName' },
                    totalQuantity: { $sum: '$orderedItems.quantity' },
                    totalRevenue: {
                        $sum: {
                            $multiply: [
                                { $toDouble: '$orderedItems.quantity' },
                                { $toDouble: '$orderedItems.price' }
                            ]
                        }
                    }
                }
            },
            { $sort: { totalQuantity: -1 } }, 
            { $limit: 10 } 
        ]);
        

console.log(bestSellingProducts,'bestSellingProducts :')

        const topBrands = await Order.aggregate([
            { $match: { status: 'Delivered' } }, 
            { $unwind: '$orderedItems' }, 
            {
                $lookup: { 
                    from: 'products', 
                    localField: 'orderedItems.product',
                    foreignField: '_id', 
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $group: { 
                    _id: '$productDetails.brand',
                    totalQuantity: { $sum: '$orderedItems.quantity' }, 
                    totalRevenue: {
                        $sum: {
                            $multiply: [
                                { $toDouble: '$orderedItems.quantity' },
                                { $toDouble: '$orderedItems.price' }
                            ]
                        }
                    }
                }
            },
            { $sort: { totalQuantity: -1 } }, 
            { $limit: 10 }, 
            {
                $project: {
                    brand: '$_id',
                    totalQuantity: 1,
                    totalRevenue: 1,
                    _id: 0
                }
            }
        ]);
        


        const topCategories = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $unwind: '$orderedItems' },
            {
                $lookup: {
                    from: 'products', 
                    localField: 'orderedItems.product', 
                    foreignField: '_id', 
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' }, 
            {
                $lookup: { 
                    from: 'categories', 
                    localField: 'productDetails.category',
                    foreignField: '_id', 
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $group: { 
                    _id: '$categoryDetails.name', 
                    totalQuantity: { $sum: '$orderedItems.quantity' },
                    totalRevenue: {
                        $sum: {
                            $multiply: [
                                { $toDouble: '$orderedItems.quantity' },
                                { $toDouble: '$orderedItems.price' }
                            ]
                        }
                    }
                }
            },
            { $sort: { totalQuantity: -1 } }, 
            { $limit: 10 }, 
            {
                $project: {            
                    category: '$_id', 
                    totalQuantity: 1,
                    totalRevenue: 1,
                    _id: 0
                }
            }
        ]);
        







        res.render('salesReport', {
            totalOrders,
            totalUsers,
            totalProducts,
            totalSales,
            totalDiscount,
            orders,
            // topProductDetails,
            bestSellingProducts,
            topBrands,
            topCategories
        });
    } catch (error) {
        console.log("The error is", error);
    }
};

const logout = async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log('error destroying session',err)
                return res.redirect('/pageerror')
            }
            res.redirect('/admin/login')
        })
    } catch (error) {
        console.log('unexpected error during logout',error)
        res.redirect('/pageerror')
    }
}



module.exports ={
    loadlogin,
    login,
    loadDashboard,
    pageerror,
    logout,
}