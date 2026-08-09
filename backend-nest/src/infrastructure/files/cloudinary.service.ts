import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

export type UploadedAvatar = { url: string; publicId: string };

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    const cloudName = config.get<string>("CLOUDINARY_NAME");
    const apiKey = config.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = config.get<string>("CLOUDINARY_API_SECRET");
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadedAvatar> {
    const data = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(data, {
      public_id: `avatar_${userId}_${Date.now()}`,
      folder: "user_avatars",
      overwrite: true,
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  async uploadCourseThumbnail(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadedAvatar> {
    const data = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(data, {
      public_id: `course_thumbnail_${userId}_${Date.now()}`,
      folder: "course_thumbnails",
      overwrite: true,
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  async delete(publicId: string): Promise<void> {
    if (publicId) await cloudinary.uploader.destroy(publicId);
  }
}
