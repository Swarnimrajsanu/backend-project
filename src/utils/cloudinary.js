import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async(localFilePath) => {
    try {
        console.log("Uploading file:", localFilePath);

        if (!localFilePath) {
            console.log("No file path provided");
            return null;
        }

        if (!fs.existsSync(localFilePath)) {
            console.log("File does not exist at path:", localFilePath);
            return null;
        }

        // Configure Cloudinary with hardcoded credentials for testing
        cloudinary.config({
            cloud_name: 'dv4po6yxw',
            api_key: '989639598893177',
            api_secret: 'eSxzP7UWggTvA0tzx9tFhs-LPp0' // Replace with your actual secret
        });

        // Upload the file
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("Upload successful:", response.secure_url || response.url);

        // Remove temp file after successful upload
        try {
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch {}

        // Return the URL string
        return response.secure_url || response.url;

    } catch (error) {
        console.log("Upload error:", error.message);
        // Remove temp file on error
        try {
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch {}
        return null;
    }
}



export { uploadOnCloudinary };
