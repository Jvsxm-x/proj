const mongoose = require("mongoose");

const connectDB =  () => {

     mongoose.connect(process.env.MONGO_URI).then(res=>console.log("✅ MongoDB connecté !")).catch(err=>console.log(err))
    
};

module.exports = connectDB;
