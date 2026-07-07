import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";

export class UploadService {
  static uploadImage(file: Express.Multer.File, folderName?: string) {
    const uploadedImage: Promise<UploadApiResponse> = new Promise(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folderName || "uploads",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result as UploadApiResponse);
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      },
    );

    return uploadedImage;
  }

  static async deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}
