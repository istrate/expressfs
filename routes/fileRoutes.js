/**
 * File management routes
 */
const express = require('express');
const path = require('path');
const router = express.Router();
const FileHelper = require('../utils/fileHelper');
const logger = require('../utils/logger');
const config = require('../config/config');
const { validatePagination, validateFileUpload, validateDeleteRequest } = require('../middleware/validator');

const storeDir = path.join(__dirname, '..', config.upload.storeDirectory);

/**
 * GET /api/files
 * Get list of files with pagination
 */
router.get('/files', validatePagination, async (req, res, next) => {
    try {
        const { page, limit } = req.pagination;
        
        const fileList = await FileHelper.getFilesWithMetadata(storeDir);

        // Calculate pagination
        const totalFiles = fileList.length;
        const totalSize = fileList.reduce((sum, file) => sum + file.size, 0);
        const totalPages = Math.ceil(totalFiles / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedFiles = fileList.slice(startIndex, endIndex);

        res.json({
            files: paginatedFiles,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalFiles: totalFiles,
                totalSize: totalSize,
                filesPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/upload
 * Upload single or multiple files
 */
router.post('/upload', validateFileUpload, async (req, res, next) => {
    try {
        let targetFiles = req.files.target_file;
        
        // Handle single file upload
        if (!Array.isArray(targetFiles)) {
            targetFiles = [targetFiles];
        }

        const results = [];
        let completed = 0;
        let hasError = false;

        // Process each file
        for (const file of targetFiles) {
            try {
                const uploadPath = path.join(storeDir, file.name);
                await file.mv(uploadPath);
                logger.info(`File "${file.name}" uploaded successfully`);
                results.push({ 
                    filename: file.name, 
                    success: true 
                });
            } catch (err) {
                logger.error(`Error uploading file "${file.name}"`, err);
                results.push({ 
                    filename: file.name, 
                    success: false, 
                    error: err.message 
                });
                hasError = true;
            }
            completed++;
        }

        const successCount = results.filter(r => r.success).length;
        
        if (hasError) {
            res.status(207).json({ 
                message: `Uploaded ${successCount} of ${targetFiles.length} file(s)`,
                results: results 
            });
        } else {
            res.json({ 
                success: true, 
                message: `Successfully uploaded ${successCount} file(s)`,
                results: results 
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/delete
 * Delete multiple files
 */
router.post('/delete', validateDeleteRequest, async (req, res, next) => {
    try {
        const { files } = req.body;
        const results = [];
        let errorOccurred = false;

        for (const filename of files) {
            const filePath = path.join(storeDir, filename);
            try {
                await FileHelper.deleteFile(filePath);
                logger.info(`File "${filename}" deleted successfully`);
                results.push({ filename, success: true });
            } catch (err) {
                logger.error(`Error deleting file "${filename}"`, err);
                results.push({ filename, success: false, error: err.message });
                errorOccurred = true;
            }
        }

        if (errorOccurred) {
            res.status(207).json({ 
                message: 'Some files could not be deleted', 
                results 
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Files deleted successfully', 
                results 
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;