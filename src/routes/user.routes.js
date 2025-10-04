import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verify } from "jsonwebtoken";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router();

router.route("/register").post(
    upload.any(), // Accept any field name
    registerUser);

router.route("/login").post(loginUser);

//secure routes

router.route("/logout").post(verifyJWT, logoutUser)


export default router;