const mongoose = require('mongoose')
const {Schema} = mongoose


const adressSchema = new Schema({
    userId :{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true

    },
    address:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true,
    },
    city:{
        type:String,
        required:true,
    },
    landMark:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true,
    },
    pincode:{
        type:Number,
        required:true,
    },
    phone:{
        type:SVGAnimatedNumber,
        required:true,
    },
    email:{
        type:String,
        required:true,
    }


})


const Address = mongoose.model('Address',addressSchema)
module.exports =Address