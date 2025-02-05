const Brand = require('../../models/brandSchema')
const Product = require("../../models/productSchema")






const getBrandPage = async(req,res)=>{
    try { 
        const page = parseInt(req.query.page) || 1
        const limit = 4
        const skip = (page-1)*limit
        const brandData = await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit)
        const totalBrands = await Brand.countDocuments()
        const totalPages = Math.ceil(totalBrands/limit)
        res.render('brands',{
            data:brandData,
            currentPage:page,
            totalPages:totalPages,
            totalBrands:totalBrands,
        })

    } catch (error) {
        console.error(error.message)
        console.log(error)
       res.redirect('/pageerror') 
    }
}

const addBrand = async (req, res) => {
    try {
        const brand = req.body.name.trim();
        if (!brand) {
            return res.json({ success: false, message: "Brand name is required!" });
        }


        const findBrand = await Brand.findOne({ brandName: { $regex: new RegExp("^" + brand + "$", "i") } });

        if (findBrand) {
            return res.json({ success: false, message: "Brand already exists!" });
        }

        if (!req.file || !req.file.filename) {
            return res.json({ success: false, message: "Brand image is required!" });
        }

        const image = req.file.filename;

        const newBrand = new Brand({
            brandName: brand,
            brandImage: image
        });

        await newBrand.save();
        return res.json({ success: true, message: "Brand added successfully!" });

    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: "Something went wrong!" });
    }
};

const blockBrand = async(req,res)=>{
    try {
        const id = req.query.id
        await Brand.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/brands')
        } catch (error) {
            res.redirect('/pageerror')
    }
}


const unBlockBrand = async(req,res)=>{
    try {
        const id = req.query.id
        await Brand.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/brands')
        } catch (error) {
        res.redirect('/pageerror')
    }
}

const deleteBrand = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ success: false, message: "Brand ID is required!" });
        }
        const deletedBrand = await Brand.findByIdAndDelete(id);
        if (!deletedBrand) {
            return res.status(404).json({ success: false, message: "Brand not found!" });
        }
    
        // return res.json({ success: true, message: "Brand deleted successfully!" });
        res.redirect('/admin/brands')
    } catch (error) {
        console.error("Error deleting brand:", error);
        return res.status(500).json({ success: false, message: "Something went wrong!" });
    }
};











module.exports = {
    getBrandPage,
    addBrand,
    blockBrand,
    unBlockBrand,
    deleteBrand,
}