import { registerAs } from '@nestjs/config';
import { config as convictConfig } from './convict-config.js';

export default registerAs('swagger', () => ({
  enabled: convictConfig.get('swagger.enabled'),
  path: convictConfig.get('swagger.path'),
  title: convictConfig.get('appName'),
  description: 'Product management REST API - LMT Group Technical Test',
  version: convictConfig.get('appVersion'),
}));
