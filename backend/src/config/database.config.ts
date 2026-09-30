import { registerAs } from '@nestjs/config';
import { config as convictConfig } from './convict-config.js';

export default registerAs('database', () => ({
  uri: convictConfig.get('db.uri'),
  host: convictConfig.get('db.host'),
  port: convictConfig.get('db.port'),
  name: convictConfig.get('db.name'),
  user: convictConfig.get('db.auth.user'),
  password: convictConfig.get('db.auth.password'),
  options: {
    maxPoolSize: convictConfig.get('db.poolSize'),
    minPoolSize: 2,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  },
}));
