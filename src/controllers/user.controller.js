import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
// import { verifyJWt } from "../middlewares/auth.middleware.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, "user doesn't found");
    }
    console.log("hello", userId);
    const accessToken = await user.generateAccessToken();
    console.log(accessToken);
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while saving access token and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, userName } = req.body;

  // get user details from frontend
  // validation - not empty
  // check if user already exists : username and email
  // check  for image, check for avatar,
  // upload them on cloudinarty
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res.

  if (
    [userName, fullName, email, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    // this User we imported from user.modal.js and we can use directly because it is made by directly mongoose and talk with databse.
    $or: [{ userName }, { email }],
  });
  // console.log("user already registerd",existedUser)
  if (existedUser) {
    throw new ApiError(400, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is requird");
  }
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    userName: userName.toLowerCase(),
    coverImage: coverImage?.url || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );
  console.log("user registerd", createdUser);
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong white registering the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take input from fron-end
  // username or email, all input should be there
  // find the user
  // check password
  // Generate  access token and refresh token
  // send token in cookies
  // send response

  const { email, userName, password } = req.body;

  // if( !email || !userName ) {
  //   throw new ApiError(400, "All fields are required")    IT IS WRONG WAY TO WRITE ( OR and NOT ) OPERATOR WITH TWO FIELDS
  // }
  if (!email && !userName) {
    throw new ApiError(400, "All fields are required");
  }

  // if you want login one tf them
  // if (!(email || userName)) {
  //   throw new ApiError(400, "All fields are required"); //  IT IS CORRECT WAY TO WRITE ( OR and NOT ) OPERATOR WITH TWO FIELDS
  // }
  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  console.log(userName, email, password);

  if (!user) {
    throw new ApiError(400, "user are not registred");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  // console.log(isPasswordValid)

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials.");
  }
  console.log(user._id);
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

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
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
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
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logout successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token expired or used");
    }

    const { accessToken, newRefreshToken } = generateAccessTokenAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200,
        { accessToken, refreshToken: newRefreshToken },
        "access token and refresh token generated successfully")
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});
const getCurrentUser  = asyncHandler(async(req,res)=>{
  return res.status(200).json(new ApiResponse(200,req.user,"current user fetched successfully"))
})
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  if (!(newPassword === confirmNewPassword)) {
    throw new ApiError(400, "newpassword and confirmpassword are not same");
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid user");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {email,fullName} = req.body;
  if(!email || !fullName) {
    throw new ApiError(400,"All fields are required")
  }
  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{fullName,email}
    },
    {
      new:true
    }
  ).select("password")

  return res.status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=> {
  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath) {
    throw new ApiError(400,"avatar file is missing ")
  }

  const avatar = uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url) {
    throw new ApiError(400,"Error while uploading avatar")
  }
  const user = await User.findByIdAndUpdate(req.body?._id,
    {
      $set:{avatar:avatar.url}
    },
    {
      new:true
    }
  ).select("-password")
  return res.status(200)
  .json(new ApiResponse(200,user,"Avatar file is updated successfully"))
})

const updateCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover image is missing")
  }

  const coverImage = uploadOnCloudinary(coverImageLocalPath)
  if(coverImage.url) {
    throw new ApiError(400,"Error while uploading cover image")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{coverImage:coverImage.url}
    },
    {
      new:true
    }
  ).select("password")
  return res.status(200)
  .json(new ApiResponse(200,user,"cover image updated successfully"))
})


export {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
  refreshAccessToken,
  getCurrentUser,
  updateCoverImage,
  updateUserAvatar,
  updateAccountDetails
};
