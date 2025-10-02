import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uplodOnCloudinary = async(localFilepath) => {
    try {
        if (!localFilepath) return null;
        const response = await cloudinary.uploader.upload(localFilepath, {
            resource_type: "auto",
        })
        console.log("File uploaded to Cloudinary successfully", response.url);
        return response.url;
    } catch (error) {
        fs.unlinkSync(localFilepath);
        console.log("Error while uploading file to Cloudinary", error);
        return null;
    }
}



export { uplodOnCloudinary };
