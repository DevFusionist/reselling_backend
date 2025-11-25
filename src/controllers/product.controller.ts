import { Context } from "hono";
import { productService } from "../services/product.service";
import { CreateProductDTO, UpdateProductDTO, ProductListDTO } from "../dtos/product.dto";
import { success, failure } from "../utils/apiResponse";

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
    const body = await c.req.json();
    const parsed = CreateProductDTO.safeParse(body);
    if (!parsed.success) {
      return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);
    }

    const product = await productService.create(parsed.data);
    return c.json(success(product, "Product created successfully"));
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
    const id = Number(c.req.param("id"));
    if (!id || isNaN(id)) {
      return c.json(failure("Invalid product ID", "VALIDATION_ERROR"), 400);
    }

    const body = await c.req.json();
    const parsed = UpdateProductDTO.safeParse(body);
    if (!parsed.success) {
      return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);
    }

    const product = await productService.update(id, parsed.data);
    return c.json(success(product, "Product updated successfully"));
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
  }
};

