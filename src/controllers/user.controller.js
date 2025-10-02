import { asyncHandler } from "../utils/assyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uplodOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async(req, res) => {
    // get users details from frontend
    // validation - not empty
    // check user already exists
    // check for image,check for avtar
    // upload them to cloudinary,avtar
    //create user object -create entryn in db
    // remove passowrd and response token field from response
    // check for user creation
    // return res

    const { fullName, email, username, password } = req.body
    console.log("email", email);

    if ([fullName, email, username, password].some(field => field ?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser= User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }
    const avtarLocalPath = req.files?.avtar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avtarLocalPath) {
        throw new ApiError(400, "Avtar is required")
    }

     const avtar = await uplodOnCloudinary(avtarLocalPath)
        const coverImage = await uplodOnCloudinary(coverImageLocalPath)
        if (!avtar) {
            throw new ApiError(500, "Could not upload avtar, please try again later")
        }
        const user = await User.create({
            fullName,
            email,
            username: username.toLowerCase(),
            password,
            avtar: avtar.url,
            coverImage: coverImage ?.url || ""
        })

        const createdUser = await user.findById(user._id).select("-password -refreshToken -__v -createdAt -updatedAt")
        if (!createdUser) {
            throw new ApiError(500, "Could not create user, please try again later")
        }

        return res.status(201).json(new ApiResponse(201, true, "User created successfully", createdUser))

})

export {
    registerUser
};