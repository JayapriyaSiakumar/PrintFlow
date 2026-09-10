import dotenv from 'dotenv';

// Load .env variables first
dotenv.config();

/**
 * Sanitizes environment variables to prevent runtime crashes caused by common
 * copy-paste formats in environment settings (such as copying "CLOUDINARY_URL=cloudinary://..."
 * directly into the CLOUDINARY_URL variable, or wrapping in quotes).
 */
export function sanitizeEnvironment(): void {
  // 1. Sanitize CLOUDINARY_URL
  if (process.env.CLOUDINARY_URL) {
    let url = process.env.CLOUDINARY_URL.trim();

    // Strip leading 'export '
    if (url.startsWith('export ')) {
      url = url.substring(7).trim();
    }
    // Strip leading 'CLOUDINARY_URL=' if pasted with key name
    if (url.startsWith('CLOUDINARY_URL=')) {
      url = url.substring('CLOUDINARY_URL='.length).trim();
    }
    // Strip surrounding quotes
    url = url.replace(/^['"]|['"]$/g, '').trim();

    if (url.toLowerCase().startsWith('cloudinary://')) {
      process.env.CLOUDINARY_URL = url;
      try {
        const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)/i);
        if (match) {
          const [, apiKey, apiSecret, cloudName] = match;
          if (!process.env.CLOUDINARY_API_KEY) process.env.CLOUDINARY_API_KEY = apiKey;
          if (!process.env.CLOUDINARY_API_SECRET) process.env.CLOUDINARY_API_SECRET = apiSecret;
          if (!process.env.CLOUDINARY_CLOUD_NAME) process.env.CLOUDINARY_CLOUD_NAME = cloudName;
        }
      } catch (_) {
        // ignore regex error
      }
    } else {
      console.warn(
        `⚠️ [Environment Sanitizer]: Invalid CLOUDINARY_URL protocol ("${url.substring(0, 20)}..."). Expected "cloudinary://...". Unsetting to prevent crash.`
      );
      delete process.env.CLOUDINARY_URL;
    }
  }

  // 2. Sanitize individual Cloudinary variables
  ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach((key) => {
    if (process.env[key]) {
      let val = process.env[key]!.trim();
      if (val.startsWith(`${key}=`)) {
        val = val.substring(`${key}=`.length).trim();
      }
      val = val.replace(/^['"]|['"]$/g, '').trim();
      process.env[key] = val;
    }
  });

  // 3. If CLOUDINARY_URL was missing/deleted but credentials exist, reconstruct clean URL
  if (
    !process.env.CLOUDINARY_URL &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME
  ) {
    process.env.CLOUDINARY_URL = `cloudinary://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@${process.env.CLOUDINARY_CLOUD_NAME}`;
  }
}

// Execute immediately upon module import
sanitizeEnvironment();
