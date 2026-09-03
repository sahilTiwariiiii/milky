const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down...', err);
  process.exit(1);
});

const autoSeedIfEmpty = require('./seeds/autoSeed');

const awsConfigStatus = {
  AWS_ACCESS_KEY_ID: Boolean(env.AWS_ACCESS_KEY_ID),
  AWS_SECRET_ACCESS_KEY: Boolean(env.AWS_SECRET_ACCESS_KEY),
  AWS_REGION: Boolean(env.AWS_REGION),
  S3_BUCKET_NAME: Boolean(env.S3_BUCKET_NAME)
};

console.log('[AWS S3] Loaded config:', awsConfigStatus);

const validateS3Config = async () => {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_REGION || !env.S3_BUCKET_NAME) {
    console.warn('[AWS S3] Missing one or more required S3 environment variables. S3 upload features may fail.');
    return;
  }
console.log('[AWS DEBUG]', {
  accessKey: env.AWS_ACCESS_KEY_ID?.slice(0, 4) + '...',
  region: JSON.stringify(env.AWS_REGION),
  bucket: JSON.stringify(env.S3_BUCKET_NAME)
});
 
  const s3 = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
  });

  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET_NAME }));
    console.log(`[AWS S3] SUCCESS: Bucket "${env.S3_BUCKET_NAME}" is accessible with the supplied credentials.`);
  } catch (err) {
    console.error(`[AWS S3] FAILED: Bucket "${env.S3_BUCKET_NAME}" is not accessible.`);
    console.error('[AWS S3] Error details:', err.message || err);
  }
};

// Connect to Database & Start Server
connectDB()
  .then(async () => {
    await validateS3Config();

    // Automatically seed default accounts if database is fresh/empty
    await autoSeedIfEmpty();

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`[Server] Running in ${env.NODE_ENV} mode on 0.0.0.0:${env.PORT}`);
      console.log(`[Server] API available at http://localhost:${env.PORT}/api`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('[UNHANDLED REJECTION] Shutting down...', err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown signals
    process.on('SIGTERM', () => {
      console.log('[SIGTERM RECEIVED] Shutting down gracefully...');
      server.close(() => {
        console.log('[Process Terminated]');
      });
    });
  })
  .catch((err) => {
    console.error('[Startup Error] Failed to connect to database:', err.message);
  });
