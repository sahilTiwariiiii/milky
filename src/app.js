const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const AppError = require('./utils/appError');
const { apiLimiter } = require('./middlewares/rateLimiter');

const path = require('path');
const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: env.CORS_ORIGIN }));

// Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiting
app.use('/api', apiLimiter);

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Customer QR & Milk/Product Management API',
    docs: '/api/health',
    version: '1.0.0'
  });
});

// Mount API routes
app.use('/api', routes);

// Handle 404 Not Found
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
