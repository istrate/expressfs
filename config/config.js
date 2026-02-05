/**
 * Application Configuration
 */
const { parseSize } = require('../utils/sizeParser');

module.exports = {
    // Server configuration
    server: {
        port: process.env.PORT || 8080,
        host: process.env.HOST || '0.0.0.0'
    },

    // File upload configuration
    upload: {
        // Maximum file size - supports human-readable format (e.g., "5GB", "100MB", "1TB")
        // Default: 5GB
        maxFileSize: parseSize(process.env.MAX_FILE_SIZE || '5GB'),
        allowedExtensions: [], // Empty array means all extensions allowed
        storeDirectory: process.env.STORE_DIRECTORY || 'store',
        useTempFiles: false,
        tempFileDir: 'tmp'
    },

    // Pagination configuration
    pagination: {
        defaultLimit: 10,
        maxLimit: 100,
        allowedLimits: [10, 50, 100]
    },

    // Logging configuration
    logging: {
        enabled: true,
        includeTimestamp: true
    }
};