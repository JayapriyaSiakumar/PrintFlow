import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure in-memory buffer storage so files are streamed directly to Cloudinary
const storage = multer.memoryStorage();

// Allowed image MIME types for apparel and merchandise prints
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
];

// Maximum allowed file size: 15MB
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file format: ${file.mimetype}. Allowed formats: PNG, JPG, JPEG, WEBP, SVG, GIF.`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 5,
  },
  fileFilter,
});

/**
 * Wrapper for single file upload with standard error handling.
 * Supports multipart/form-data with any field name (e.g. 'file', 'image') as well as application/json pass-through.
 */
export const handleSingleUpload = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      return next();
    }

    const uploadMiddleware = upload.any();
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: `File size exceeds the 15MB limit. Please upload an optimized image.`,
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed validation',
        });
      }

      // Assign first uploaded file to req.file
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        req.file = req.files.find((f) => f.fieldname === fieldName) || req.files[0];
      }

      next();
    });
  };
};

/**
 * Wrapper for multiple files upload.
 */
export const handleMultipleUpload = (fieldName: string = 'files', maxCount: number = 5) => {
  const uploadMiddleware = upload.array(fieldName, maxCount);

  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: `One or more files exceed the 15MB limit.`,
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: `Too many files uploaded. Maximum is ${maxCount}.`,
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || 'Multiple file upload validation failed',
        });
      }
      next();
    });
  };
};
