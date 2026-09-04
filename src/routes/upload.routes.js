const express = require('express');
const router = express.Router();
const multer = require('multer');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const s3Service = require('../services/s3.service');

// Multer in-memory storage for streaming directly to AWS S3
const storage = multer.memoryStorage();

// File filter (Images and PDFs)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, WEBP, GIF, SVG, and PDF files are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter
});

// Middleware wrapper for multer error handling
const handleMulterUpload = (req, res, next) => {
  const uploadSingle = upload.single('file');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File too large. Maximum file size allowed is 10MB.', 400));
      }
      return next(new AppError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

router.post('/', handleMulterUpload, async (req, res, next) => {
  try {
    // 1. Handle multipart form-data file
    if (req.file) {
      const uploadResult = await s3Service.uploadFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        folder: 'uploads'
      });

      return ApiResponse.success(res, 'File uploaded successfully to S3', {
        url: uploadResult.url,
        key: uploadResult.key,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        mimetype: uploadResult.mimetype,
        size: uploadResult.size,
        storage: uploadResult.storage
      });
    }

    // 2. Support base64 or JSON data URL payload
    if (req.body && req.body.base64) {
      const base64Data = req.body.base64;
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      let mime = 'image/png';
      let buffer;

      if (matches && matches.length === 3) {
        mime = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }

      const originalname = req.body.filename || `upload_${Date.now()}.${mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png'}`;

      const uploadResult = await s3Service.uploadFile({
        buffer,
        originalname,
        mimetype: mime,
        folder: 'uploads'
      });

      return ApiResponse.success(res, 'File uploaded successfully to S3 from base64', {
        url: uploadResult.url,
        key: uploadResult.key,
        filename: uploadResult.filename,
        mimetype: uploadResult.mimetype,
        size: uploadResult.size,
        storage: uploadResult.storage
      });
    }

    // 3. Fallback if client passed raw fileUrl
    if (req.body && req.body.fileUrl) {
      return ApiResponse.success(res, 'File URL received successfully', {
        url: req.body.fileUrl
      });
    }

    return next(new AppError('No file or base64 payload provided for upload.', 400));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
