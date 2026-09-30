import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    const { method, url } = request;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;
          const statusCode = context
            .switchToHttp()
            .getResponse<{ statusCode: number }>().statusCode;
          this.logger.log(`${method} ${url} ${statusCode} - ${duration}ms`);
        },
        error: (error: Error) => {
          const duration = Date.now() - startedAt;
          this.logger.error(
            `${method} ${url} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
