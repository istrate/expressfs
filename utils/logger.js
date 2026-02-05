/**
 * Logger utility for consistent logging across the application
 */
const config = require('../config/config');

class Logger {
    constructor() {
        this.enabled = config.logging.enabled;
        this.includeTimestamp = config.logging.includeTimestamp;
    }

    _getTimestamp() {
        return this.includeTimestamp ? new Date().toISOString() + ' ' : '';
    }

    info(message) {
        if (this.enabled) {
            console.log(`${this._getTimestamp()}[INFO] ${message}`);
        }
    }

    error(message, error = null) {
        if (this.enabled) {
            console.error(`${this._getTimestamp()}[ERROR] ${message}`);
            if (error) {
                console.error(error);
            }
        }
    }

    warn(message) {
        if (this.enabled) {
            console.warn(`${this._getTimestamp()}[WARN] ${message}`);
        }
    }

    debug(message) {
        if (this.enabled && process.env.NODE_ENV === 'development') {
            console.log(`${this._getTimestamp()}[DEBUG] ${message}`);
        }
    }
}

module.exports = new Logger();