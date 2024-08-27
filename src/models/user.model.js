import dotenv from 'dotenv'; // here dotenv
dotenv.config()
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.js";
import jwt from 'jsonwebtoken'


const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true, ///  It is very important to learn index bcz its very expansive
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, /// from cloudinary
      required: true,
    },
    coverImage: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      trim: true,
    },
    watchHisory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  // console.log(password)
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = async function () {
 
  try {
    const token=  jwt.sign(
      {
        _id: this._id,
        userName: this.userName,
        fullName: this.fullName,
        email: this.email
      },

      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIREY
      }
    );
    console.log("generateAccessToken method called");
    return token
   
  } catch (error) {
    throw new ApiError(400, "something wrong while saving access token");
  }

 
};
userSchema.methods.generateRefreshToken = async function () {
   return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIREY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
