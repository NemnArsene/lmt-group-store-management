import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name:
        configService.get('CLOUDINARY_CLOUD_NAME') ||
        configService.get('cloudinary.cloudName'),
      api_key:
        configService.get('CLOUDINARY_API_KEY') ||
        configService.get('cloudinary.apiKey'),
      api_secret:
        configService.get('CLOUDINARY_API_SECRET') ||
        configService.get('cloudinary.apiSecret'),
    });
  },
};
