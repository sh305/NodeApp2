const mongoose = require('mongoose');
const dns = require('dns');

// Ensure reliable DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb+srv://admin:Shivam123@cluster0.t579xyt.mongodb.net/yoyo_app?retryWrites=true&w=majority&appName=Cluster0';
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
