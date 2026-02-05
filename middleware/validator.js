/**
 * Request validation middleware
 */
const config = require('../config/config');
const { formatSize } = require('../utils/sizeParser');

/**
 * Validate pagination parameters
 */
function validatePagination(req, res, next) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || config.pagination.defaultLimit;

    // Validate page number
    if (page < 1) {
        return res.status(400).json({ error: 'Page number must be greater than 0' });
    }

    // Validate limit
    if (!config.pagination.allowedLimits.includes(limit)) {
        return res.status(400).json({
            error: `Invalid limit. Allowed values: ${config.pagination.allowedLimits.join(', ')}`
        });
    }

    // Attach validated values to request
    req.pagination = { page, limit };
    next();
}

/**
 * Validate file upload
 */
function validateFileUpload(req, res, next) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were selected for upload' });
    }

    let files = req.files.target_file;
    if (!Array.isArray(files)) {
        files = [files];
    }

    // Validate file sizes
    for (const file of files) {
        if (file.size > config.upload.maxFileSize) {
            return res.status(400).json({
                error: `File ${file.name} exceeds maximum size of ${formatSize(config.upload.maxFileSize)}`
            });
        }

        // Validate file extensions if configured
        if (config.upload.allowedExtensions.length > 0) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (!config.upload.allowedExtensions.includes(ext)) {
                return res.status(400).json({
                    error: `File type .${ext} is not allowed. Allowed types: ${config.upload.allowedExtensions.join(', ')}`
                });
            }
        }
    }

    next();
}

/**
 * Validate delete request
 */
function validateDeleteRequest(req, res, next) {
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'No files specified for deletion' });
    }

    // Validate filenames (basic security check)
    for (const filename of files) {
        if (typeof filename !== 'string' || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Invalid filename detected' });
        }
    }

    next();
}

module.exports = {
    validatePagination,
    validateFileUpload,
    validateDeleteRequest
};