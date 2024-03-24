import connectDb from "./db/index.js";
import dotenv from "dotenv";

// to use this we are adding dotenv/config in our database.
dotenv.config({
  path: "./env",
});

connectDb();
