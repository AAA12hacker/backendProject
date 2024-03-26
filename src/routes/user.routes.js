import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUserDetails,
  getUserChannelProfile,
  getUserWatchHistory,
  loginUser,
  logoutUser,
  refreshTokenUser,
  registerUser,
  updateCoverImage,
  updateUserAvatar,
  updateUserDetails,
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
// no need of middle ware as we have using jwt in code, refreshToken route
router.route("/refresh-token").post(refreshTokenUser);
// currentPassword Change
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
// data User get
router.route("/userDetails").get(verifyJWT, getCurrentUserDetails);
// update user without file
router.route("/update-user").patch(verifyJWT, updateUserDetails);
// update avatar imagae
router
  .route("/update-user-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
// update coverImage
router
  .route("/update-user-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
// get userChannelProfile
// we are getting the userName from params , so we added /:userName
router
  .route("/user-channel-profile/:userName")
  .get(verifyJWT, getUserChannelProfile);
// get userWatchHistory
router.route("/user-watch-history").get(verifyJWT, getUserWatchHistory);

export default router;
