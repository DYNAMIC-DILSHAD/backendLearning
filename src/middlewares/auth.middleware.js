import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import {User} from '../models/user.model.js'
import { asyncHandler } from "../utils/asyncHandler.js";


export const verifyJWt = asyncHandler(
    async (req,_,next) => {
       try {
         // this token is encoded form.
         const token = await req.cookies?.accessToken || req.header(Authorization)?.replace("Bearer ","");
         if(!token) {
             throw new ApiError(400,"Unathorized request")
         }
     
         // here we are decoding the token with the help of ACCESS_REFRESH_TOKEN_SECRET
         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
         const user = await User.findById(decodedToken?._id).select("-refreshToken, -password");
         if(!user) {
 
             throw new ApiError(401,"Invalid Access Token")
         }
     
         req.user = user;
         next()
       } catch (error) {
         throw new ApiError(401, error?.message || "Invalid Access Token" )
       }
    }
)