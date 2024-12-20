// const passport = require('passport')
// const GoogleStratergy = require('passport-google-oauth20').Strategy
// const User = require('../models/userSchema')
// const env = require('dotenv').config()



// passport.use(new GoogleStratergy({
//     clientId:process.env.GOOGLE_CLIENT_ID,
//     clientSecret :process.env.GOOGLE_CLIENT_SECRET,
//     callbackUrl :'/auth/google/callback'
// },

// async (accessToken,refreshToken,profile,done)=>{
//     try {
//         let user = await User.findOne({googleId:profile.id})
//         if(user){
//             return done(null,user)
//         }else{
//             user = new User({
//                 name:profile.displayName,
//                 email:profile.emails[0].value,
//                 googleId:profile.id,
//             })
//             await user.save()
//             return done(null,user)
//         }
//     } catch (error) {
//         return done(error,null)
//     }
// }
// ))


// passport.serializeUser((user,done)=>{
//     done(null,user.id)

// })

// passport.deserializeUser((id,done)=>{
//        User.findById(id)
//        .then(user=>{
//          done(err,null)
//        })
//        .catch(err=>{
//         done(err,null)
//        })
// })


// module.exports = passport



const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');
const env = require('dotenv').config();


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
            return done(null, user); // If user exists, log them in
        } else {
            // If user does not exist, create a new one
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
            });
            await user.save();
            return done(null, user); // Create and log the new user in
        }
    } catch (error) {
        return done(error, null); // Handle errors during the process
    }
}));

// Serialize user to store the session
passport.serializeUser((user, done) => {
    done(null, user.id); // Store only the user's ID in session
});

// Deserialize user to retrieve the full user data
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user); // Successfully found user by ID
        })
        .catch(err => {
            done(err, null); // Handle errors in retrieving the user
        });
});

module.exports = passport;
