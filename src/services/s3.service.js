const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

class S3Service {
  constructor() {
    this.hasS3Config = Boolean(
      env.AWS_ACCESS_KEY_ID &&
      env.AWS_SECRET_ACCESS_KEY &&
      env.AWS_REGION &&
      env.S3_BUCKET_NAME
    );

    if (this.hasS3Config) {
      this.s3Client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY
        }
      });
      this.bucket = env.S3_BUCKET_NAME;
      this.region = env.AWS_REGION;
    }
  }

  isConfigured() {
    return Boolean(this.hasS3Config && this.s3Client && this.bucket);
  }

  /**
   * Upload buffer directly to AWS S3
   * @param {Object} params
   * @param {Buffer} params.buffer
   * @param {string} params.originalname
   * @param {string} params.mimetype
   * @param {string} [params.folder='uploads']
   * @returns {Promise<{ url: string, key: string, storage: 's3'|'local' }>}
   */
  async uploadFile({ buffer, originalname = 'file', mimetype = 'image/png', folder = 'uploads' }) {
    const ext = path.extname(originalname).toLowerCase() || (mimetype.includes('jpeg') ? '.jpg' : mimetype.includes('webp') ? '.webp' : mimetype.includes('pdf') ? '.pdf' : '.png');
    const safeBase = path
      .basename(originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30) || 'upload';
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const filename = `${safeBase}_${uniqueSuffix}${ext}`;
    const s3Key = `${folder}/${filename}`;

    // 1. Try uploading to AWS S3 if configured
    if (this.isConfigured()) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
          Body: buffer,
          ContentType: mimetype
        });

        await this.s3Client.send(command);

        const s3Url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${s3Key}`;
        return {
          url: s3Url,
          key: s3Key,
          filename,
          originalName: originalname,
          mimetype,
          size: buffer.length,
          storage: 's3'
        };
      } catch (s3Error) {
        console.error('[S3Service] S3 upload error, falling back to local storage:', s3Error.message || s3Error);
      }
    }

    // 2. Fallback to local storage (e.g. for offline unit tests or network issues)
    const localUploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }
    const localFilePath = path.join(localUploadsDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    return {
      url: `/uploads/${filename}`,
      key: filename,
      filename,
      originalName: originalname,
      mimetype,
      size: buffer.length,
      storage: 'local'
    };
  }
}

module.exports = new S3Service();
