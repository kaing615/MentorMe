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

async function uploadFile(buffer, options = {}) {
    try {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: options.resource_type || "auto",
                    folder: options.folder || "uploads",
                    ...options
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result.secure_url);
                    }
                }
            ).end(buffer);
        });
    } catch (error) {
        throw error;
    }
}

export {
    uploadImage,
    uploadFile
}