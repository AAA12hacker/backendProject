import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDb = async () => {
  try {
    const connectionDataBase = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `mongodb connect successful on DB Host!!",${connectionDataBase.connection.host}`
    );
  } catch (error) {
    console.log("MongodDB connection Failed", error);
    process.exit(1);
  }
};

export default connectDb;
