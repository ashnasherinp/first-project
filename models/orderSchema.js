

// const mongoose = require('mongoose');
// const { Schema } = mongoose;
// const { v4: uuidv4 } = require('uuid');

// const orderSchema = new Schema({
//     orderId: {
//         type: String,
//         default: () => uuidv4(),
//         unique: true,
//     },
//     orderedItems: [{
//         product: {
//             type: Schema.Types.ObjectId,
//             ref: 'Product', // Assuming the product is a reference to a Product model
//             required: true,  // Ensure this field is required
//         },
//         quantity: {
//             type: Number,
//             required: true,  // Ensures quantity is required
//         },
//         price: {
//             type: Number,
//             default: 0,  // Default to 0 if no price is provided
//         },
//     }],
//     totalPrice: {
//         type: Number,
//         required: true,  // Ensures totalPrice is required
//     },
//     discount: {
//         type: Number,
//         default: 0,  // Default discount to 0 if not provided
//     },
//     finalAmount: {
//         type: Number,
//         // required: true,  // Ensures finalAmount is required
//     },
//     address: [{
//         type: Schema.Types.ObjectId,
//         ref: 'Address',  // reference to address model
//         required: true,
//     }],
//     invoiceDate: {
//         type: Date,
//     },
//     status: {
//         type: String,
//         // required: true,
//         enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Returned'],
//         default:"Pending"
//     },
//     createdOn: {
//         type: Date,
//         default: Date.now,
//         // required: true,  // Ensures createdOn is required
//     },
//     couponApplied: {
//         type: Boolean,
//         default: false,
//     },
// });

// const Order = mongoose.model('Order', orderSchema);
// module.exports = Order;
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Ensure 'User' matches the name of the User model
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
            ref: 'Product', // Reference to Product model
            required: true,  // Ensures product is required
        },
      
        quantity: {
            type: Number,
            required: true,  // Ensures quantity is required
        },
        price: {
            type: Number,
            default: 0,  // Default to 0 if no price is provided
        },
        status: {
            type: String,
            enum: ['Ordered', 'Return Requested', 'Returned','Return Rejected'], // Track individual product status
            default: 'Ordered', // Default status is 'Ordered'
        },
        returnReason: {
            type: String, // Stores the reason for returning this product
            default: null,
        },
        returnDate: {
            type: Date, // Records when the product was returned
            default: null,
        },
    }],
    totalPrice: {
        type: Number,
        required: true,  // Ensures totalPrice is required
    },
    discount: {
        type: Number,
        default: 0,  // Default discount to 0 if not provided
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
        enum: ['Pending', 'Paid', 'Failed', 'Cancelled'], // Add more statuses if necessary
        default: 'Pending', // Default is 'Pending'
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
        type: String,  // Store the coupon code used
        default: null, // This can be null if no coupon was applied
      },
    paymentMethod: { 
        type: String,
        required: true,  
    },
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
