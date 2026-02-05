/**
 * File helper utilities
 */
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class FileHelper {
    /**
     * Get all files from a directory with their metadata
     * @param {string} directory - Directory path
     * @returns {Promise<Array>} Array of file objects
     */
    static async getFilesWithMetadata(directory) {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    logger.error('Error reading directory', err);
                    return reject(err);
                }

                try {
                    const fileList = files
                        .filter(file => file !== '.gitkeep')
                        .map(file => {
                            const filePath = path.join(directory, file);
                            const stats = fs.statSync(filePath);
                            return {
                                name: file,
                                uploadDate: stats.mtime.toISOString(),
                                size: stats.size
                            };
                        })
                        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

                    resolve(fileList);
                } catch (error) {
                    logger.error('Error processing files', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Delete a file
     * @param {string} filePath - Path to file
     * @returns {Promise<boolean>} Success status
     */
    static async deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(filePath)) {
                return reject(new Error('File not found'));
            }

            fs.unlink(filePath, (err) => {
                if (err) {
                    logger.error(`Error deleting file: ${filePath}`, err);
                    return reject(err);
                }
                logger.info(`File deleted: ${filePath}`);
                resolve(true);
            });
        });
    }

    /**
     * Check if file exists
     * @param {string} filePath - Path to file
     * @returns {boolean} Exists status
     */
    static fileExists(filePath) {
        return fs.existsSync(filePath);
    }

    /**
     * Ensure directory exists, create if not
     * @param {string} directory - Directory path
     */
    static ensureDirectoryExists(directory) {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
            logger.info(`Directory created: ${directory}`);
        }
    }
}

module.exports = FileHelper;