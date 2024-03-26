import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("bearer ", "");
    if (!token) {
      throw new ApiError(400, "unAuthorize request");
    }
    const decodeUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodeUser._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(404, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid Access Token ");
  }
});
