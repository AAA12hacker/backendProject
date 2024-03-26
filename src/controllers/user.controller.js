import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  // why we are generating both the accesstoken and refreshtoken to keep the user logged in,
  // but we are using refreshtoken to again give the user chance to login until the time period
  // so that's the reason we are storing refreshToken in cookie and userDb
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.refreshAccessToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /* start logic */
  // get data from the frontend
  // validation is not empty
  // check if email or username is already register
  // check for images, avatar image is required
  // use Multer to handle the image upload
  // upload avatar on cloudinary
  // create user object and create entry in db
  // remove password and refresh token from the response
  // check if user is created or give a error not created
  // return res or return err if not completed
  /* end logic */

  // req.body will just contain the json data not files
  const { fullName, email, password, userName } = req.body;
  //   console.log(email);

  // some is used to check if anything is false in this give error
  if (
    [fullName, email, password, userName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All required fields should not be empty");
  }
  //this is one way to doo to check singly
  //   User.findOne({ email });

  // but i would like to check both the values together
  // User can communicate with the mongoose model as it is connected to mongoose
  try {
    const userExistAlready = await User.findOne({
      $or: [{ userName }, { email }],
    });

    if (userExistAlready) {
      throw new ApiError(409, "user already exist");
    }
  } catch (error) {
    console.log(error);
  }

  // to upload the image we are attaching the middleware in user.route folder
  console.log({ files: req?.files });
  console.log({ body: req.body });
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files?.coverImage) &&
    req.files?.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  const user = await User.create({
    fullName,
    email,
    password,
    userName: userName.toLowerCase(),
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
  });

  // use of select is it discards the items which you don't want
  const createdUser = await User.findById(user._id)?.select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering");
  }
  console.log({ createdUser });
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User register successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body which gives input data
  // verify from which the user is trying to login using email or username
  // find user
  // then check for the password correct
  // then make a accesstoken and refreshtoken to securely to keep logged in user for specific period
  // send cookie of accesstoken and refreshtoken

  console.log(req);

  const { email, password, userName } = req.body;
  console.log({ userName, email, password });
  if (!userName && !email) {
    throw new ApiError(400, "userName or email required to login");
  }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(401, "User not exist");
  }
  const isVerifyUser = await user.isPasswordCorrect(password);
  if (!isVerifyUser) {
    throw new ApiError(404, "Invalid Credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUserDetail = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // this is used for only the from server you can edit the tokens not from frontend
  // it is a secure way of creating
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUserDetail,
          accessToken,
          refreshToken,
        },
        "User loggedIn Successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user Logged Out"));

  // in this we need to remove cookies of accesstoken and refreshtoken
  // and also we need to make undefined for refrestoken in userDb
  /* 
    problem we will face here is we don't have any body.req to find the user
    so we are creating middleware to verify user with jwt
  */
});
const refreshTokenUser = asyncHandler(async (req, res) => {
  // we can get refreshToken from our cookie
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorize request");
  }
  const decodeUser = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await User.findById(decodeUser?._id);
  if (!user) {
    throw new ApiError(400, "invalid refresh token");
  }
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "refreshed token is expired or used");
  }
  const options = {
    httpOnly: true,
    secure: true,
  };
  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user._id);
  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        refreshToken: newRefreshToken,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = User.findById(req.user?._id);
  const isPasswordVerified = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordVerified) {
    throw new ApiError(400, "Invalid password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password Changed Successfully"));
});

const getCurrentUserDetails = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: req.user }, "User data fetched successfully")
    );
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "Field are required to update user");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "user successfully Updated"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading Avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "user successfully Updated"));
});
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading Avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "user successfully Updated"));
});

// aggregation Pipeline implemented
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName.trim()) {
    throw new ApiError(400, "username is missing");
  }
  //   they are two Ways we can find the data with username
  //   await User.find({ userName });
  // Here we are introducing the concepts of aggregation and aggregation pipelines
  const channel = User.aggregate([
    {
      // with match statement we searched the user
      $match: {
        userName: userName?.toLowerCase(), // we are writing lowercase=> db we stored in lower case form
      },
    },
    {
      // we are searching in another and storing it's value in a variable with "as" keyword
      $lookup: {
        // we are searching from subscription model,
        // reason of writing=>subscriptions is it stores the collection with this name in db
        from: "subscriptions",
        // from our user collection
        localField: "_id",
        // from our subscriptions collection
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          // just now we have make this field as subscribers
          // using "$" reason it is field
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        avatar: 1,
        userName: 1,
        email: 1,
        channelSubscribedToCount: 1,
        subscriberCount: 1,
        isSubscribed: 1,
        coverImage: 1,
      },
    },
  ]);
  console.log({ channel });
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        // the reason is we are using mongoose.Types.ObjectId to get the Id in string or else it will
        // return objectId("daafada")
        _id: new mongoose.Types.ObjectId(req.user?.id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // we are using nested pipeline because we have owner in the watchHisory
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              // we are giving same name as of collection value
              as: "owner",
              // here we are integrating pipeline again because to get the data which is important
              // not all data
              // we can direct write another pipeline but we are going nested as it will change the format of data
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                    userName: 1,
                  },
                },
              ],
            },
          },
          // we are writing another pipeline to return the array's first object only
          {
            $addFields: {
              // overriding owner
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res.status(200).json(
    new ApiResponse(
      200,
      // here to avoid we can have directly send the watchhistory with aggregation
      user[0]?.watchHistory,
      "watch history fetched successfully"
    )
  );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokenUser,
  changeCurrentPassword,
  getCurrentUserDetails,
  updateUserDetails,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
