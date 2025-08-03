import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv"

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(imagePath, options = {}) {
    try {
        const result = await cloudinary.uploader.upload(imagePath, options);
        return result;
    } catch (error) {
        throw error;
    }
}

export {
    uploadImage,
}