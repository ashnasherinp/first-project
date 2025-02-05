
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    

    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true,
    },
    orderedItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,  
        },
      
        quantity: {
            type: Number,
            required: true, 
        },
        price: {
            type: Number,
            default: 0, 
        },
        status: {
            type: String,
            enum: ['Ordered', 'Return Requested', 'Returned','Return Rejected'], 
            default: 'Ordered',
        },
        returnReason: {
            type: String, 
            default: null,
        },
        returnDate: {
            type: Date, 
            default: null,
        },
    }],
    totalPrice: {
        type: Number,
        required: true,  
    },
    discount: {
        type: Number,
        default: 0,  
    },
    finalAmount: {
        type: Number,
    },
    address: {
        addressType: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        landMark: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: Number,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        altPhone: {
            type: String,
        },
    },
    invoiceDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Requested', 'Returned'],
        default: "Pending",
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Cancelled'], 
        default: 'Pending',
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
    couponApplied: {
        type: Boolean,
        default: false,
    },
    couponCode: {
        type: String, 
        default: null,
      },
    paymentMethod: { 
        type: String,
        required: true,  
    },
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
