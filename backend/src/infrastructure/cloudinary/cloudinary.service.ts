import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import 'multer';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * Upload a file buffer to Cloudinary
   * @param file - Multer file object
   * @param folder - Cloudinary folder (e.g., 'products')
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `store/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(error);
          }
          this.logger.log(`File uploaded to Cloudinary: ${result!.public_id}`);
          resolve(result!);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  /**
   * Delete a file from Cloudinary by its public ID
   */
  async deleteFile(publicId: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error(`Cloudinary delete failed: ${error.message}`);
          return reject(error);
        }
        this.logger.log(`File deleted from Cloudinary: ${publicId}`);
        resolve(result);
      });
    });
  }
}
