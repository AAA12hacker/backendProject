import { app } from "./app.js";
import connectDb from "./db/index.js";
import dotenv from "dotenv";

// to use this we are adding dotenv/config in our database.
dotenv.config({
  path: "./env",
});

connectDb()
  .then(() => {
    const port = process.env.PORT || 8000;
    app.on("ERROR", (error) => {
      console.log("server error when listening to app", error);
    });
    app.listen(port, () => {
      console.log(`server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(`Mongo DB connection failed`, err);
  });
