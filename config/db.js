const mongoose =require('mongoose')
const env =require('dotenv').config()
  


const connectDB = async ()=>{
    try{
        mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000  // Set to 30 seconds
        });
        
         console.log('db connected');
         
    }catch(error){
        console.log('db connection error',error.message);
        process.exit(1 )
        

    }
}
 

module.exports = connectDB