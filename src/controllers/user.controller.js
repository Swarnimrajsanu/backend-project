import { asyncHandler } from "../utils/assyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generatAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Could not generate tokens, please try again later")
    }
}


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
    //const coverImageLocalPath = req.files ?.[1] ?.path;
    let coverImageLocalPath = "";
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

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

const loginUser = asyncHandler(async(req, res) => {
    //req body -> data
    //ussername or email
    //find the user
    //check for password
    //generate access and refresh token
    //send cookies
    const { username, email, password } = req.body
    if (!username || !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generatAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken ")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).cookie("refreshToken", refreshToken, options).cookie("accessToken", accessToken, options).json(new ApiResponse(200, true, "User logged in successfully", loggedInUser))

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
            $set: {
                refreshToken: undefined
            }
        }, { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, true, "User logged out successfully", null))

})




export {
    registerUser,
    loginUser,
    logoutUser
};