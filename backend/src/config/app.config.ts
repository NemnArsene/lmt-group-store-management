import { registerAs } from '@nestjs/config';
import { config as convictConfig } from './convict-config.js';

export default registerAs('app', () => ({
  nodeEnv: convictConfig.get('env'),
  port: convictConfig.get('port'),
  host: convictConfig.get('host'),
  name: convictConfig.get('appName'),
  version: convictConfig.get('appVersion'),
  baseUrl: convictConfig.get('baseUrl'),
  apiPrefix: convictConfig.get('basePath'),
}));
