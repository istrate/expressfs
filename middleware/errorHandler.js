/**
 * Error handling middleware
 */
const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
    logger.error(`Error occurred: ${err.message}`, err);

    // Default error status and message
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
    res.status(404).json({
        error: 'Resource not found'
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};