import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// it is used because to accept which url from frontend can access this backend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// how much of json data can be accepted when requesting
app.use(express.json({ limit: "16kb" }));
// it is used for url to understand "+","%20" like this
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// it is used for images to keep in sever temp
app.use(express.static("public"));
// it is used to read and perform crud operation on cookies as you
// need to store cookies secure in user browser
app.use(cookieParser());

// import routes
import userRoutes from "./routes/user.routes.js";

// declare routes
app.use("/api/v1/users", userRoutes);

export { app };
