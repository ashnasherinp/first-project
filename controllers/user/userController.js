const User = require("../../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user;
    if (user) {
      const userData = await User.findOne({ _id: user._id });

      return res.render("home", { user: userData });
    } else {
      return res.render("home");
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
// const loadSignup = async(req,res)=>Promise<any>
const loadSignup = async (req, res) => {
  try {
    return res.render("signup");
  } catch (error) {
    console.log("home page not loading:", error);
    res.status(500).send("server error");
  }
};

// const loadShopping = async(req,res)=>{
//     try {
//         return res.render('shop')
//         } catch (error) {
//         console.log('shopping page not loading:',error)
//         res.status(500).send('server error')
//     }
// }

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

    const passwordMatch = bcrypt.compare(password, findUser.password);
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

module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignup,
  // loadShopping,
  signup,
  verifyOtp,
  resendOtp,
  loadlogin,
  login,
  logout,
};
