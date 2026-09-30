import convict from 'convict';

export const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'staging', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    doc: 'The port to bind.',
    format: Number,
    default: 3000,
    env: 'PORT',
    arg: 'port',
  },
  host: {
    doc: 'Application host.',
    format: String,
    default: 'localhost',
    env: 'HOST',
  },
  appName: {
    doc: 'Application name',
    format: String,
    default: 'Store Management API',
    env: 'APP_NAME',
  },
  appVersion: {
    doc: 'Application version',
    format: String,
    default: '1.0.0',
    env: 'APP_VERSION',
  },
  baseUrl: {
    doc: 'API base url.',
    format: String,
    default: 'http://localhost:3000',
    env: 'BASE_URL',
  },
  basePath: {
    doc: 'API base path.',
    format: String,
    default: 'api/v1',
    env: 'BASE_PATH',
  },
  db: {
    host: {
      doc: 'Database host name/IP',
      format: String,
      default: '127.0.0.1',
      env: 'DB_MONGO_HOST',
    },
    port: {
      doc: 'Database port',
      format: Number,
      default: 27017,
      env: 'DB_MONGO_PORT',
    },
    name: {
      doc: 'Database name',
      format: String,
      default: 'store',
      env: 'DB_MONGO_NAME',
    },
    uri: {
      doc: 'Full MongoDB URI',
      format: String,
      default: 'mongodb://127.0.0.1:27017/store',
      env: 'MONGODB_URI',
    },
    auth: {
      user: {
        doc: 'Database user if any',
        format: String,
        default: '',
        env: 'DB_MONGO_USERNAME',
      },
      password: {
        doc: 'Database password if any',
        format: String,
        default: '',
        env: 'DB_MONGO_PASSWORD',
      },
    },
    poolSize: {
      doc: 'Connection pool size',
      format: Number,
      default: 10,
      env: 'DB_POOL_SIZE',
    },
  },
  swagger: {
    enabled: {
      doc: 'Enable Swagger documentation',
      format: Boolean,
      default: true,
      env: 'SWAGGER_ENABLED',
    },
    path: {
      doc: 'Swagger documentation path',
      format: String,
      default: 'api-docs',
      env: 'SWAGGER_PATH',
    },
  },
  cloudinary: {
    cloudName: {
      doc: 'Cloudinary Cloud Name',
      format: String,
      default: '',
      env: 'CLOUDINARY_CLOUD_NAME',
    },
    apiKey: {
      doc: 'Cloudinary API Key',
      format: String,
      default: '',
      env: 'CLOUDINARY_API_KEY',
    },
    apiSecret: {
      doc: 'Cloudinary API Secret',
      format: String,
      default: '',
      env: 'CLOUDINARY_API_SECRET',
    },
  },
  logging: {
    level: {
      doc: 'Log level',
      format: ['error', 'warn', 'info', 'debug', 'verbose'],
      default: 'info',
      env: 'LOG_LEVEL',
    },
    format: {
      doc: 'Log format',
      format: ['json', 'simple'],
      default: 'simple',
      env: 'LOG_FORMAT',
    },
  },
});

// Load environment-specific configuration
const env = config.get('env');
try {
  config.loadFile('./src/env/' + env + '.json');
} catch (error) {
  // File may not exist, use defaults
}

// Validate configuration
config.validate({ allowed: 'strict' });

export type ConfigType = typeof config;
