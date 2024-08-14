import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv'; // here dotenv
dotenv.config()
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilePath) => {
  try {
    if(!localfilePath) return null
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type:"auto",
    });
    console.log("file uploded on cloudinary", response.url);
    fs.unlinkSync(localfilePath); // we removed the temp file from public folder
    return response;
  } catch (error) {
    fs.unlinkSync(localfilePath);  // we removed the temp file from public folder in case of failed
    return null
  }
};

export default uploadOnCloudinary ;
