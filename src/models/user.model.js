import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

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
  return await bcrypt.compare(this.password, password);
};
userSchema.methods.generateAccessToken = function () {
  return Jwt.sign(
    {
      _id: this._id,
      userName: this.userName,
      fullName: this.fullName,
      email: this.email,
    },

    process.env.ACCESS_REFRESH_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIREY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return Jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIREY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
