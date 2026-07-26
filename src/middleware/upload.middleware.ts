import multer from 'multer';
import { AppError } from './error.middleware.js';

const maxProductImageSize = 5 * 1024 * 1024;
const maxProductImageCount = 10;

export const productImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxProductImageSize,
        files: maxProductImageCount
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
            callback(new AppError('Only image files are allowed', 400));
            return;
        }

        callback(null, true);
    }
});
