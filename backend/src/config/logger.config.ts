import { registerAs } from '@nestjs/config';
import type { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { config as convictConfig } from './convict-config.js';

export default registerAs('logger', (): WinstonModuleOptions => ({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, context, ...meta }) => {
            const ctx = context ? `[${context}] ` : '';
            return `${timestamp} ${ctx}${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          },
        ),
      ),
    }),
    ...(convictConfig.get('env') === 'production'
      ? [
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
        ]
      : []),
  ],
}));
