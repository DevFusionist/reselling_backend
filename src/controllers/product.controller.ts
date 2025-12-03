import { Context } from "hono";
import { productService } from "../services/product.service";
import { CreateProductDTO, UpdateProductDTO, ProductListDTO, UpdateProductInput } from "../dtos/product.dto";
import { success, failure } from "../utils/apiResponse";
import { r2Service } from "../services/r2.service";
import { productImageRepo } from "../repositories/productImage.repo";
import { R2_PUBLIC_URL, R2_BUCKET_NAME } from "../config";

/**
 * Convert R2 URL to public domain URL for product images
 * @param originalUrl - The R2 storage URL
 * @returns Public domain URL
 */
function convertProductImageToPublicUrl(originalUrl: string): string {
  if (!R2_PUBLIC_URL) {
    return originalUrl; // Fallback to original URL if public URL not configured
  }
  
  // Extract path after bucket name (e.g., "product/product-name/filename.jpg")
  // R2 URL format: https://<endpoint>/<bucket>/product/...
  const urlParts = originalUrl.split('/');
  const bucketIndex = urlParts.findIndex(part => part === R2_BUCKET_NAME);
  
  if (bucketIndex === -1 || bucketIndex === urlParts.length - 1) {
    return originalUrl; // Fallback if URL structure is unexpected
  }
  
  // Get path after bucket name
  const pathAfterBucket = urlParts.slice(bucketIndex + 1).join('/');
  return `${R2_PUBLIC_URL}/${pathAfterBucket}`;
}

export const productController = {
  async createBulk(c: Context) {
    try {
      // Get uploaded file from form data
      const formData = await c.req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return c.json(failure("No file provided", "VALIDATION_ERROR"), 400);
      }

      // Validate file type
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv');
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

      if (!isCSV && !isExcel) {
        return c.json(
          failure("Invalid file type. Only CSV and Excel files are supported", "VALIDATION_ERROR"),
          400
        );
      }

      // Save file temporarily using fs streams for memory efficiency
      const fs = await import("fs/promises");
      const path = await import("path");
      const os = await import("os");

      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `import_${Date.now()}_${file.name}`);

      // Write file using stream for memory efficiency
      const fileBuffer = await file.arrayBuffer();
      await fs.writeFile(tempFilePath, Buffer.from(fileBuffer));

      try {
        // Process file: backend reads and parses the file
        let result;
        if (isCSV) {
          result = await productService.importFromCSV(tempFilePath);
        } else {
          // For Excel files, we need to parse them
          // Since we can't use external packages, we'll need to handle this differently
          // For now, return error - Excel parsing requires a library
          return c.json(
            failure(
              "Excel file parsing requires additional library. Please convert to CSV or use a library like 'xlsx'",
              "NOT_IMPLEMENTED"
            ),
            501
          );
        }

        return c.json(
          success(
            {
              imported: result.success,
              failed: result.failed,
              total: result.success + result.failed,
              errors: result.errors.slice(0, 20) // Limit error details
            },
            `Import completed: ${result.success} products imported, ${result.failed} failed`
          )
        );
      } finally {
        // Clean up temp file
        await fs.unlink(tempFilePath).catch(() => {
          // Ignore cleanup errors
        });
      }
    } catch (error: any) {
      return c.json(
        failure(error.message || "File import failed", "IMPORT_ERROR"),
        500
      );
    }
  },

  async create(c: Context) {
    try {
      // Check if request is multipart form data (for image upload)
      const contentType = c.req.header("content-type") || "";
      let productData: any;
      let imageUrls: string[] = [];

      if (contentType.includes("multipart/form-data")) {
        // Handle multipart form data with images
        const formData = await c.req.formData();
        const jsonData = formData.get("data") as string;

        if (!jsonData) {
          return c.json(failure("Product data is required", "VALIDATION_ERROR"), 400);
        }

        productData = JSON.parse(jsonData);

        // Get all image files (support both "image" and "images" field names for backward compatibility)
        const imageFiles: File[] = [];
        const singleImage = formData.get("image") as File | null;
        const multipleImages = formData.getAll("images") as File[];

        if (singleImage && singleImage.size > 0) {
          imageFiles.push(singleImage);
        }
        if (multipleImages && multipleImages.length > 0) {
          imageFiles.push(...multipleImages.filter(file => file && file.size > 0));
        }

        // Validate and upload images if provided
        if (imageFiles.length > 0) {
          const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
          const maxSize = 5 * 1024 * 1024; // 5MB

          // Validate all images
          for (const imageFile of imageFiles) {
            if (!validImageTypes.includes(imageFile.type)) {
              return c.json(
                failure("Invalid image type. Only JPEG, PNG, WEBP, and GIF are allowed", "VALIDATION_ERROR"),
                400
              );
            }

            if (imageFile.size > maxSize) {
              return c.json(
                failure("Image size exceeds 5MB limit", "VALIDATION_ERROR"),
                400
              );
            }
          }

          // Upload all images to R2
          const uploadedUrls = await r2Service.uploadProductImages(imageFiles, productData.title || productData.sku);
          // Convert R2 URLs to public domain URLs
          imageUrls = uploadedUrls.map(url => convertProductImageToPublicUrl(url));
        }
      } else {
        // Handle JSON request (backward compatibility)
        productData = await c.req.json();
      }

      const parsed = CreateProductDTO.safeParse(productData);
      if (!parsed.success) {
        return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);
      }

      const product = await productService.create({ ...parsed.data, image_urls: imageUrls });
      return c.json(success(product, "Product created successfully"));
    } catch (error: any) {
      return c.json(
        failure(error.message || "Failed to create product", "CREATE_ERROR"),
        500
      );
    }
  },

  async getById(c: Context) {
    const id = Number(c.req.param("id"));
    if (!id || isNaN(id)) {
      return c.json(failure("Invalid product ID", "VALIDATION_ERROR"), 400);
    }

    const product = await productService.getById(id);
    return c.json(success(product));
  },

  async update(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      if (!id || isNaN(id)) {
        return c.json(failure("Invalid product ID", "VALIDATION_ERROR"), 400);
      }

      // Check if request is multipart form data (for image upload)
      const contentType = c.req.header("content-type") || "";
      let productData: any;
      let imageUrls: string[] = [];

      if (contentType.includes("multipart/form-data")) {
        // Handle multipart form data with images
        const formData = await c.req.formData();
        const jsonData = formData.get("data") as string;

        if (!jsonData) {
          return c.json(failure("Product data is required", "VALIDATION_ERROR"), 400);
        }

        productData = JSON.parse(jsonData);

        // Get all image files (support both "image" and "images" field names for backward compatibility)
        const imageFiles: File[] = [];
        const singleImage = formData.get("image") as File | null;
        const multipleImages = formData.getAll("images") as File[];

        if (singleImage && singleImage.size > 0) {
          imageFiles.push(singleImage);
        }
        if (multipleImages && multipleImages.length > 0) {
          imageFiles.push(...multipleImages.filter(file => file && file.size > 0));
        }

        // Validate and upload images if provided
        if (imageFiles.length > 0) {
          const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
          const maxSize = 5 * 1024 * 1024; // 5MB

          // Validate all images
          for (const imageFile of imageFiles) {
            if (!validImageTypes.includes(imageFile.type)) {
              return c.json(
                failure("Invalid image type. Only JPEG, PNG, WEBP, and GIF are allowed", "VALIDATION_ERROR"),
                400
              );
            }

            if (imageFile.size > maxSize) {
              return c.json(
                failure("Image size exceeds 5MB limit", "VALIDATION_ERROR"),
                400
              );
            }
          }

          // Get product name for path (use new title from formData if provided, otherwise existing)
          let productName = productData.title || productData.sku;
          if (!productName) {
            const existingProduct = await productService.getById(id);
            // Handle both old format (direct product) and new format (product with images)
            const product = (existingProduct as any).product || existingProduct;
            productName = product.title || product.sku;
          }
          
          // Upload all images to R2
          const uploadedUrls = await r2Service.uploadProductImages(imageFiles, productName);
          // Convert R2 URLs to public domain URLs
          imageUrls = uploadedUrls.map(url => convertProductImageToPublicUrl(url));
        }
      } else {
        // Handle JSON request (backward compatibility)
        productData = await c.req.json();
      }

      const parsed = UpdateProductDTO.safeParse(productData);
      if (!parsed.success) {
        return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);
      }

      const product = await productService.update(id, {...parsed.data, image_urls: imageUrls} as UpdateProductInput & { image_urls: string[] });
      return c.json(success(product, "Product updated successfully"));
    } catch (error: any) {
      return c.json(
        failure(error.message || "Failed to update product", "UPDATE_ERROR"),
        500
      );
    }
  },

  async delete(c: Context) {
    const id = Number(c.req.param("id"));
    if (!id || isNaN(id)) {
      return c.json(failure("Invalid product ID", "VALIDATION_ERROR"), 400);
    }

    await productService.delete(id);
    return c.json(success(null, "Product deleted successfully"));
  },

  async list(c: Context) {
    const query = c.req.query();
    const parsed = ProductListDTO.safeParse(query);
    if (!parsed.success) {
      return c.json(failure("Invalid query parameters", "VALIDATION_ERROR"), 400);
    }

    const result = await productService.list(parsed.data);
    return c.json(success(result));
  },

  async deleteImage(c: Context) {
    try {
      const imageId = Number(c.req.param("imageId"));
      if (!imageId || isNaN(imageId)) {
        return c.json(failure("Invalid image ID", "VALIDATION_ERROR"), 400);
      }

      await productImageRepo.deleteById(imageId);
      return c.json(success(null, "Product image deleted successfully"));
    } catch (error: any) {
      return c.json(
        failure(error.message || "Failed to delete image", "DELETE_ERROR"),
        500
      );
    }
  }
};

