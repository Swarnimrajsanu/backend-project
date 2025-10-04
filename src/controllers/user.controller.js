import { asyncHandler } from "../utils/assyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


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

const refreshaAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required")
    }


     try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
   
        const user = await User.findById(decodedToken?.id)
   
        if (!user){
           throw new ApiError(401, "Invalid refresh token")
        }
   
        if (incomingRefreshToken !== user.refreshToken){
           throw new ApiError(401, "Invalid or expired refresh token")
        }
   
   
        const options = {
           httpOnly: true,
           secure: true
        }
   
        const {accessToken, newRefreshToken} = await generatAccessTokenAndRefreshToken(user._id)
   
   
           return res
           .status(200)
           .cookie("refreshToken", newRefreshToken, options)
           .cookie("accessToken", accessToken, options)
           .json(new ApiResponse(200, true, "Access token refreshed successfully", { accessToken, refreshToken: newRefreshToken }))
     } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token")
        
     }
})

const changeCurrentUserPassword = asyncHandler(async(req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully", null))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user,  "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const { fullname, email } = req.body

    if(!fullname || !email){
        throw new ApiError(400, "Fullname and email are required")
    }

    User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set: {
                fullname,
                email
            } 
        },
        {new: true}

    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200, true, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Could not upload avatar, please try again later")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password ")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"))
})

const updateUsercoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is missing")
    }

    const coverImage = await uploadOnCloudinary(avatarLocalPath)
    if (!coverImage.url) {
        throw new ApiError(500, "Could not upload coverImage, please try again later")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password ")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is required")
    }

    // mongo db pipeline aggregation

    const channel = await User.aggregate([

        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))



})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshaAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage,
    getUserChannelProfile
};