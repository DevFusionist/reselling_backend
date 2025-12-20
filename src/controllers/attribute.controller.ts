import { Context } from "hono";
import { attributeService } from "../services/attribute.service";
import { success, failure } from "../utils/apiResponse";

export const attributeController = {
  async getAllCategories(c: Context) {
    try {
      const categories = await attributeService.getAllCategories();
      return c.json(success(categories, "Categories fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch categories", "SERVER_ERROR"), 500);
    }
  },

  async getAllSubCategories(c: Context) {
    try {
      const categoryId = c.req.query("category_id");
      const subCategories = await attributeService.getAllSubCategories(
        categoryId ? parseInt(categoryId) : undefined
      );
      return c.json(success(subCategories, "Sub categories fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch sub categories", "SERVER_ERROR"), 500);
    }
  },

  async getSubCategoriesByCategory(c: Context) {
    try {
      const categoryId = c.req.param("categoryId");
      if (!categoryId) {
        return c.json(failure("Category ID is required", "VALIDATION_ERROR"), 400);
      }
      const subCategories = await attributeService.getSubCategoriesByCategory(parseInt(categoryId));
      return c.json(success(subCategories, "Sub categories fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch sub categories", "SERVER_ERROR"), 500);
    }
  },

  async getAllBrands(c: Context) {
    try {
      const brands = await attributeService.getAllBrands();
      return c.json(success(brands, "Brands fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch brands", "SERVER_ERROR"), 500);
    }
  },

  async getAllColors(c: Context) {
    try {
      const colors = await attributeService.getAllColors();
      return c.json(success(colors, "Colors fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch colors", "SERVER_ERROR"), 500);
    }
  },

  async getAllSizes(c: Context) {
    try {
      const sizes = await attributeService.getAllSizes();
      return c.json(success(sizes, "Sizes fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch sizes", "SERVER_ERROR"), 500);
    }
  },

  async getAllMaterials(c: Context) {
    try {
      const materials = await attributeService.getAllMaterials();
      return c.json(success(materials, "Materials fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch materials", "SERVER_ERROR"), 500);
    }
  },

  async getAllStyles(c: Context) {
    try {
      const styles = await attributeService.getAllStyles();
      return c.json(success(styles, "Styles fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch styles", "SERVER_ERROR"), 500);
    }
  },

  async getAllFits(c: Context) {
    try {
      const fits = await attributeService.getAllFits();
      return c.json(success(fits, "Fits fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch fits", "SERVER_ERROR"), 500);
    }
  },

  async getAllPatterns(c: Context) {
    try {
      const patterns = await attributeService.getAllPatterns();
      return c.json(success(patterns, "Patterns fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch patterns", "SERVER_ERROR"), 500);
    }
  },

  async getAllAttributes(c: Context) {
    try {
      const attributes = await attributeService.getAllAttributes();
      return c.json(success(attributes, "All attributes fetched successfully"));
    } catch (error: any) {
      return c.json(failure(error.message || "Failed to fetch attributes", "SERVER_ERROR"), 500);
    }
  },
};

