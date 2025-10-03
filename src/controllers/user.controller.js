import { asyncHandler } from "../utils/assyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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

    const { fullname, email, username, password } = req.body
    console.log("email", email);

    if ([fullname, email, username, password].some(field => field ?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }
    // With upload.any(), files come as an array
    const avatarLocalPath = req.files ?.[0] ?.path;
    const coverImageLocalPath = req.files ?.[1] ?.path;

    console.log("Avatar path:", avatarLocalPath);
    console.log("Cover image path:", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(500, "Could not upload avatar, please try again later")
    }
    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar,
        coverImage: coverImage || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken -__v -createdAt -updatedAt")
    if (!createdUser) {
        throw new ApiError(500, "Could not create user, please try again later")
    }

    return res.status(201).json(new ApiResponse(201, true, "User created successfully", createdUser))

})

export {
    registerUser
};