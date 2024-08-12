import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, userName } = req.body;
  console.log(email);

  //get user details from frontend
  //validation - not empty
  //check if user already exists : username and email
  //check  for image, check for avatar,
  //upload them on cloudinarty
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res.

  if (
    [userName, fullName, email, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    // this User we imported from user.modal.js and we can use directly because it is made by directly mongoose and talk with databse.
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
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
    userName: userName.lowercase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong white registering the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "user registered successfully"));
});

export { registerUser };
