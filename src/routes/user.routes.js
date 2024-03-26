import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshTokenUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// using fields because we have multiple object of images to upload
// register route
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
// login route
router.route("/login").post(loginUser);

//Secure Route list
//logout route
router.route("/logout").post(verifyJWT, logoutUser);
// no need of middle ware as we have using jwt in code
router.route("/refresh-token").post(refreshTokenUser);

export default router;
