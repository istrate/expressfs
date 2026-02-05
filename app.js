/**
 * ExpressFS - Simple Static File Server
 * Refactored and optimized version
 */

const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const serveIndex = require('serve-index');

// Import configuration and utilities
const config = require('./config/config');
const logger = require('./utils/logger');
const FileHelper = require('./utils/fileHelper');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const fileRoutes = require('./routes/fileRoutes');

// Initialize Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(fileUpload({
    useTempFiles: config.upload.useTempFiles,
    tempFileDir: path.join(__dirname, config.upload.tempFileDir),
    limits: { fileSize: config.upload.maxFileSize }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Ensure store directory exists
const storeDir = path.join(__dirname, config.upload.storeDirectory);
FileHelper.ensureDirectoryExists(storeDir);

// Main landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.use('/api', fileRoutes);

// Serve store directory with directory listing
app.use('/store', 
    express.static(storeDir), 
    serveIndex(storeDir, { icons: true })
);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
    logger.info(`ExpressFS server started and listening on ${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);
    logger.info(`Store directory: ${storeDir}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

module.exports = app;
