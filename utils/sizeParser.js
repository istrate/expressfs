/**
 * Size parser utility for converting human-readable sizes to bytes
 */

/**
 * Parse human-readable size string to bytes
 * Supports: KB, MB, GB, TB (case-insensitive)
 * Examples: "5GB", "100MB", "1.5TB", "500KB"
 * 
 * @param {string} sizeStr - Size string (e.g., "5GB", "100MB")
 * @returns {number} Size in bytes
 */
function parseSize(sizeStr) {
    if (typeof sizeStr === 'number') {
        return sizeStr;
    }

    if (!sizeStr || typeof sizeStr !== 'string') {
        throw new Error('Invalid size format. Expected string like "5GB" or "100MB"');
    }

    // Remove spaces and convert to uppercase
    const normalized = sizeStr.trim().toUpperCase();

    // Match number and unit
    const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?$/);

    if (!match) {
        throw new Error(`Invalid size format: "${sizeStr}". Use format like "5GB", "100MB", "1.5TB"`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || 'B';

    // Size multipliers
    const multipliers = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
    };

    const bytes = value * multipliers[unit];

    if (bytes < 0 || !isFinite(bytes)) {
        throw new Error(`Invalid size value: "${sizeStr}"`);
    }

    return Math.floor(bytes);
}

/**
 * Format bytes to human-readable size
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
    parseSize,
    formatSize
};