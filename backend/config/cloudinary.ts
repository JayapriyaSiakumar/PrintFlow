import './envSanitizer';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import memoryStore from '../utils/memoryStore';
import Order from '../models/Order';

// Strict folder hierarchy for PrintFlow Cloudinary assets
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: 'printflow/products',
  MOCKUPS: 'printflow/product-mockups',
  CATEGORIES: 'printflow/categories',
  CUSTOMER_FILES: 'printflow/customizations/customer-files',
  PREVIEWS: 'printflow/customizations/previews',
  ORDERS: 'printflow/customizations/orders',
} as const;

export type CloudinaryFolderKey = keyof typeof CLOUDINARY_FOLDERS;

/**
 * Validates whether required Cloudinary credentials are provided in environment variables.
 */
export function isCloudinaryConfigured(): boolean {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    return true;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return !!(
    cloudName &&
    cloudName.trim() !== '' &&
    apiKey &&
    apiKey.trim() !== '' &&
    apiSecret &&
    apiSecret.trim() !== ''
  );
}

/**
 * Initializes Cloudinary SDK with environment variables.
 */
let isConfigured = false;
export function initCloudinary(): typeof cloudinary {
  if (!isConfigured) {
    if (isCloudinaryConfigured()) {
      try {
        if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
          cloudinary.config();
        } else {
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
          });
        }
        isConfigured = true;
        console.log('✅ [Cloudinary]: Successfully configured with Cloudinary v2 SDK');
      } catch (err) {
        console.warn('⚠️ [Cloudinary]: Failed to configure Cloudinary SDK, using fallback:', err);
      }
    } else {
      console.warn(
        '⚠️ [Cloudinary Notice]: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET not set in environment.'
      );
      console.warn(
        'ℹ️ [Cloudinary Info]: Running in resilient fallback mode (Base64 storage & mock Public IDs). To connect your real cloud bucket, set your credentials in .env.'
      );
    }
  }
  return cloudinary;
}

export interface UploadResult {
  url: string;
  secure_url: string;
  publicId: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  isMock?: boolean;
}

/**
 * Uploads a Buffer (from Multer memory storage) to Cloudinary.
 * Falls back gracefully to a Base64 data URL if Cloudinary is not configured in the current environment.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  mimetype: string,
  options: {
    folder: string;
    filename?: string;
    tags?: string[];
  }
): Promise<UploadResult> {
  initCloudinary();

  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: options.folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        tags: options.tags || ['printflow'],
      };

      if (options.filename) {
        const cleanName = options.filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        uploadOptions.public_id = `${cleanName}_${Date.now().toString(36)}`;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload stream returned empty response'));
          }
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            isMock: false,
          });
        }
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  // Graceful fallback when credentials aren't provided in development or testing
  const base64Data = buffer.toString('base64');
  const dataUrl = `data:${mimetype};base64,${base64Data}`;
  const mockPublicId = `${options.folder.replace(/[^a-zA-Z0-9]/g, '_')}_mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  return {
    url: dataUrl,
    secure_url: dataUrl,
    publicId: mockPublicId,
    bytes: buffer.length,
    format: mimetype.split('/')[1] || 'png',
    isMock: true,
  };
}

/**
 * Uploads a Base64 string / Data URL (such as canvas preview export) to Cloudinary.
 */
export async function uploadBase64ToCloudinary(
  base64String: string,
  options: {
    folder: string;
    publicIdPrefix?: string;
    tags?: string[];
  }
): Promise<UploadResult> {
  initCloudinary();

  if (isCloudinaryConfigured()) {
    const uploadOptions: any = {
      folder: options.folder,
      resource_type: 'image',
      tags: options.tags || ['printflow', 'preview'],
    };

    if (options.publicIdPrefix) {
      uploadOptions.public_id = `${options.publicIdPrefix}_${Date.now().toString(36)}`;
    }

    const result = await cloudinary.uploader.upload(base64String, uploadOptions);
    return {
      url: result.url,
      secure_url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      isMock: false,
    };
  }

  // Fallback
  const mockPublicId = `${options.folder.replace(/[^a-zA-Z0-9]/g, '_')}_preview_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  return {
    url: base64String,
    secure_url: base64String,
    publicId: mockPublicId,
    format: 'png',
    isMock: true,
  };
}

/**
 * CRITICAL SAFETY CHECK:
 * Checks if a publicId is associated with any past or active orders.
 * Per user requirements: "Do not delete customized images from Cloudinary if they are still required for existing orders."
 */
export async function isAssetUsedInOrders(publicId: string): Promise<boolean> {
  if (!publicId || publicId.trim() === '') return false;

  // 1. Check MongoDB orders if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const match = await Order.findOne({
        $or: [
          { 'items.customDesign.previewDataUrlPublicId': publicId },
          { 'items.customDesign.previewFrontPublicId': publicId },
          { 'items.customDesign.previewBackPublicId': publicId },
          { 'items.customDesign.graphicPublicId': publicId },
          { 'items.product.imagePublicId': publicId },
        ],
      });
      if (match) return true;
    } catch (err) {
      console.error('Error verifying order asset persistence in MongoDB:', err);
    }
  }

  // 2. Check MemoryStore orders
  for (const order of memoryStore.orders) {
    for (const item of order.items || []) {
      const cd: any = item.customDesign;
      if (cd) {
        if (
          cd.previewDataUrlPublicId === publicId ||
          cd.previewFrontPublicId === publicId ||
          cd.previewBackPublicId === publicId ||
          cd.graphicPublicId === publicId
        ) {
          return true;
        }
      }
      const prod: any = item.product;
      if (prod && prod.imagePublicId === publicId) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Safely deletes an asset from Cloudinary, enforcing order-preservation protection.
 */
export async function deleteFromCloudinary(
  publicId: string,
  options: { force?: boolean } = {}
): Promise<{ success: boolean; preserved?: boolean; message: string }> {
  if (!publicId || publicId.trim() === '') {
    return { success: false, message: 'Invalid public ID provided' };
  }

  // Verify order history protection
  if (!options.force) {
    const isRequiredForOrder = await isAssetUsedInOrders(publicId);
    if (isRequiredForOrder) {
      console.warn(
        `🛡️ [Cloudinary Preservation]: Asset "${publicId}" is linked to existing order(s). Deletion prevented to preserve order history.`
      );
      return {
        success: false,
        preserved: true,
        message: 'Image preserved: This asset is linked to active or historical customer orders.',
      };
    }
  }

  initCloudinary();

  if (isCloudinaryConfigured()) {
    try {
      const res = await cloudinary.uploader.destroy(publicId);
      return {
        success: res.result === 'ok' || res.result === 'not found',
        message: res.result === 'ok' ? 'Asset deleted from Cloudinary' : `Cloudinary status: ${res.result}`,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Cloudinary delete error' };
    }
  }

  return { success: true, message: 'Asset removed from local record' };
}

/**
 * Returns overall Cloudinary integration status for debugging and UI diagnostics.
 */
export function getCloudinaryStatus() {
  const configured = isCloudinaryConfigured();
  return {
    configured,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL ? 'configured via CLOUDINARY_URL' : null),
    folders: CLOUDINARY_FOLDERS,
    mode: configured ? 'live_cloud' : 'resilient_fallback',
  };
}
