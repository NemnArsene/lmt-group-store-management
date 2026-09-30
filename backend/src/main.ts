import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter.js';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor.js';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike('StoreApp', {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Swagger / OpenAPI
  const swaggerEnabled = configService.get<boolean>('swagger.enabled') ?? true;
  if (swaggerEnabled) {
    const swaggerPath = configService.get<string>('swagger.path') ?? 'api-docs';
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('swagger.title') ?? 'Store Management API')
      .setDescription(configService.get<string>('swagger.description') ?? 'Product management REST API')
      .setVersion(configService.get<string>('swagger.version') ?? '1.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, document);
    logger.log(`📖 Swagger UI available at http://localhost:${configService.get('app.port') ?? 3000}/${swaggerPath}`, 'Bootstrap');
  }

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
  logger.log(
    `🚀 Server running on http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
}

bootstrap();

