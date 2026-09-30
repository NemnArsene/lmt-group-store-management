import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CommonModule } from '@common/common.module.js';
import {
  appConfig,
  databaseConfig,
  loggerConfig,
  swaggerConfig,
} from '@config/index.js';
import { CloudinaryModule } from '@infrastructure/cloudinary/cloudinary.module.js';
import { ProductsModule } from '@modules/products/products.module.js';
import { CategoriesModule } from '@modules/categories/categories.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, loggerConfig, swaggerConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        ...configService.get('database.options'),
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    CloudinaryModule,
    ProductsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
