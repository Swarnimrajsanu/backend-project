import { Router } from "express";
import jsonwebtoken from 'jsonwebtoken';
import { changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshaAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUsercoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const { verify } = jsonwebtoken;

import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router();

router.route("/register").post(
    upload.any(), // Accept any field name
    registerUser);

router.route("/login").post(loginUser);

//secure routes

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshaAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("/update-account").post(verifyJWT, updateAccountDetails)
router.route("/update-avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").post(verifyJWT, upload.single("cover"), updateUsercoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)


export default router;