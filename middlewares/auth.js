// const User = require('../models/userSchema')
//  const userAuth = (req,res,next)=>{
//     if(req.session.user){
//         User.findById(req.session.user)
//         .then(data=>{
//             if(data&& !data.isBlocked){
//                 console.log(req.session.user)
//                 res.locals.user = req.session.user;
//                 console.log(res.locals.user)
//                 next()
//             }else{
//                 res.redirect("/login")
//             }
//         })
//         .catch(error=>{
//             console.log("Error in user auth middleware")
//             res.status(500).send('Internal server error')
//         })
//     }else{
//         res.redirect('/login')
//     }
//  }



//  const adminAuth = (req,res,next)=>{
//     User.findOne({isAdmin:true})
//     .then(data=>{
//         if(data){
//             next()
//         }else{
//             res.redirect("/admin/login")
//         }
//     })
//     .catch(error=>{
//         console.log("error in adminauth middleware",error)
//         res.status(500).send("internal server error"

//         )
//     })
//  }

const User = require("../models/userSchema");


const userAuth = async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user);

            if (user && !user.isBlocked) {
                next(); // User is authenticated and not blocked
            } else {
                req.session.destroy(err => {
                    if (err) {
                        console.error("Error destroying session:", err);
                    }

                    return res.render("login",{message:"User is blocked by admin"}); //user blocked

                });
            }
        } else {
            res.redirect("/login"); // No user session, redirect to login
        }
    } catch (error) {
        console.error("Error in user auth middleware:", error);
        res.status(500).send("Internal server error");
    }
};




const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect("/admin/login");
        }
    })
    .catch(error=>{
        console.log("Error in adminauth middleware",error);
        res.status(500).send("Internal server error");
    })
}

module.exports = {
    userAuth,
    adminAuth
}











//  module.exports ={
//     userAuth,
//     adminAuth,
//  }