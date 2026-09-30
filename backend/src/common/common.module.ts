import { Module } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter.js';
import { LoggingInterceptor } from './interceptors/logging.interceptor.js';

@Module({
  providers: [AllExceptionsFilter, LoggingInterceptor],
  exports: [AllExceptionsFilter, LoggingInterceptor],
})
export class CommonModule {}
