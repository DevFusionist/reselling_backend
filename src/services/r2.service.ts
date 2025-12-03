import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT } from "../config";

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID as string,
    secretAccessKey: R2_SECRET_ACCESS_KEY as string,
  },
});

// Image optimization settings
const MAX_IMAGE_WIDTH = 1920; // Max width for product images
const MAX_IMAGE_HEIGHT = 1920; // Max height for product images
const MAX_PROFILE_WIDTH = 800; // Max width for profile pictures
const MAX_PROFILE_HEIGHT = 800; // Max height for profile pictures
const JPEG_QUALITY = 85; // High quality JPEG compression (0-100)
const WEBP_QUALITY = 85; // High quality WebP compression (0-100)
const PNG_QUALITY = 9; // PNG compression level (0-9, 9 is highest compression)

/**
 * Compress and optimize image while maintaining quality
 * @param buffer - Image buffer
 * @param isProfilePicture - Whether this is a profile picture (smaller dimensions)
 * @returns Optimized image buffer and content type
 */
async function optimizeImage(
  buffer: Buffer,
  isProfilePicture: boolean = false
): Promise<{ buffer: Buffer; contentType: string }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const format = metadata.format;

  // Determine max dimensions
  const maxWidth = isProfilePicture ? MAX_PROFILE_WIDTH : MAX_IMAGE_WIDTH;
  const maxHeight = isProfilePicture ? MAX_PROFILE_HEIGHT : MAX_IMAGE_HEIGHT;

  // Resize if image is too large (maintain aspect ratio)
  let processedImage = image;
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      processedImage = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  // Optimize based on format
  let optimizedBuffer: Buffer;
  let contentType: string;

  if (format === 'jpeg' || format === 'jpg') {
    optimizedBuffer = await processedImage
      .jpeg({ 
        quality: JPEG_QUALITY,
        mozjpeg: true, // Use mozjpeg for better compression
        progressive: true // Progressive JPEG for better perceived performance
      })
      .toBuffer();
    contentType = 'image/jpeg';
  } else if (format === 'png') {
    optimizedBuffer = await processedImage
      .png({ 
        quality: PNG_QUALITY,
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toBuffer();
    contentType = 'image/png';
  } else if (format === 'webp') {
    optimizedBuffer = await processedImage
      .webp({ 
        quality: WEBP_QUALITY,
        effort: 6 // Balance between compression time and file size (0-6)
      })
      .toBuffer();
    contentType = 'image/webp';
  } else {
    // For other formats, convert to WebP for better compression
    optimizedBuffer = await processedImage
      .webp({ 
        quality: WEBP_QUALITY,
        effort: 6
      })
      .toBuffer();
    contentType = 'image/webp';
  }

  return { buffer: optimizedBuffer, contentType };
}

export const r2Service = {
  /**
   * Upload a file to R2 storage
   * @param file - The file to upload (File object from form data)
   * @param key - The object key (path) in R2 bucket
   * @param isProfilePicture - Whether this is a profile picture (for optimization)
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: File, key: string, isProfilePicture: boolean = false): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Check if it's an image file
      const isImage = file.type.startsWith('image/');
      
      let finalBuffer = buffer;
      let contentType = file.type || "application/octet-stream";

      // Optimize image if it's an image file
      if (isImage) {
        try {
          const optimized = await optimizeImage(buffer, isProfilePicture);
          finalBuffer = Buffer.from(optimized.buffer);
          contentType = optimized.contentType;
          
          // Update key extension if format changed to webp
          if (optimized.contentType === 'image/webp' && !key.endsWith('.webp')) {
            key = key.replace(/\.[^.]+$/, '.webp');
          }
        } catch (error: any) {
          // If optimization fails, use original image
          console.warn(`Image optimization failed for ${key}: ${error.message}`);
        }
      }

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: finalBuffer,
        ContentType: contentType,
      });

      await s3Client.send(command);

      // Construct public URL
      // R2 public URL format: https://<account-id>.r2.cloudflarestorage.com/<bucket-name>/<key>
      const publicUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
      return publicUrl;
    } catch (error: any) {
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }
  },

  /**
   * Upload product image
   * @param file - Image file
   * @param productName - Product name (will be sanitized for path)
   * @returns Public URL of uploaded image
   */
  async uploadProductImage(file: File, productName: string): Promise<string> {
    // Sanitize product name for use in path
    const sanitizedName = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Generate unique filename (extension will be updated if converted to webp)
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    const key = `product/${sanitizedName}/${fileName}`;
    return await this.uploadFile(file, key, false);
  },

  /**
   * Upload multiple product images (optimized with parallel processing)
   * @param files - Array of image files
   * @param productName - Product name (will be sanitized for path)
   * @returns Array of public URLs of uploaded images
   */
  async uploadProductImages(files: File[], productName: string): Promise<string[]> {
    // Sanitize product name for use in path
    const sanitizedName = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Process and upload all files in parallel for optimal performance
    const uploadPromises = files.map(async (file, index) => {
      // Generate unique filename with index to ensure uniqueness
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExtension = file.name.split(".").pop() || "jpg";
      const fileName = `${timestamp}-${index}-${randomStr}.${fileExtension}`;
      
      const key = `product/${sanitizedName}/${fileName}`;
      return await this.uploadFile(file, key, false);
    });

    return await Promise.all(uploadPromises);
  },

  /**
   * Upload user profile picture
   * @param file - Image file
   * @param userId - User ID
   * @returns Public URL of uploaded image
   */
  async uploadUserProfilePicture(file: File, userId: number): Promise<string> {
    // Generate unique filename (extension will be updated if converted to webp)
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${timestamp}.${fileExtension}`;
    
    const key = `user/${fileName}`;
    return await this.uploadFile(file, key, true); // true = isProfilePicture
  },
};

