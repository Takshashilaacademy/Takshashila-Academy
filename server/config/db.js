import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    const connection = await mongoose.connect(mongoURI);

    console.log("==============================================");
    console.log("   MONGODB DATABASE CONNECTED");
    console.log("==============================================");
    console.log(`   Host: ${connection.connection.host}`);
    console.log(`   Database: ${connection.connection.name}`);
    console.log("==============================================");

  } catch (error) {
    console.error("==============================================");
    console.error("   MONGODB CONNECTION FAILED");
    console.error("==============================================");
    console.error(`   ${error.message}`);
    console.error("==============================================");

    process.exit(1);
  }
};

export default connectDB;