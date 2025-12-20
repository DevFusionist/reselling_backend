import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  categories,
  sub_categories,
  brands,
  colors,
  sizes,
  materials,
  styles,
  fits,
  patterns,
} from "../db/schema";

export const attributeService = {
  async getAllCategories() {
    return await db.select().from(categories).orderBy(categories.name);
  },

  async getAllSubCategories(categoryId?: number) {
    if (categoryId) {
      return await db
        .select()
        .from(sub_categories)
        .where(eq(sub_categories.category_id, categoryId))
        .orderBy(sub_categories.name);
    }
    return await db.select().from(sub_categories).orderBy(sub_categories.name);
  },

  async getSubCategoriesByCategory(categoryId: number) {
    return await db
      .select()
      .from(sub_categories)
      .where(eq(sub_categories.category_id, categoryId))
      .orderBy(sub_categories.name);
  },

  async getAllBrands() {
    return await db.select().from(brands).orderBy(brands.name);
  },

  async getAllColors() {
    return await db.select().from(colors).orderBy(colors.name);
  },

  async getAllSizes() {
    return await db.select().from(sizes).orderBy(sizes.name);
  },

  async getAllMaterials() {
    return await db.select().from(materials).orderBy(materials.name);
  },

  async getAllStyles() {
    return await db.select().from(styles).orderBy(styles.name);
  },

  async getAllFits() {
    return await db.select().from(fits).orderBy(fits.name);
  },

  async getAllPatterns() {
    return await db.select().from(patterns).orderBy(patterns.name);
  },

  async getAllAttributes() {
    const [
      categoriesList,
      subCategoriesList,
      brandsList,
      colorsList,
      sizesList,
      materialsList,
      stylesList,
      fitsList,
      patternsList,
    ] = await Promise.all([
      this.getAllCategories(),
      this.getAllSubCategories(),
      this.getAllBrands(),
      this.getAllColors(),
      this.getAllSizes(),
      this.getAllMaterials(),
      this.getAllStyles(),
      this.getAllFits(),
      this.getAllPatterns(),
    ]);

    // Join sub-categories with their categories for better frontend display
    const subCategoriesWithCategory = await db
      .select({
        id: sub_categories.id,
        name: sub_categories.name,
        category_id: sub_categories.category_id,
        category_name: categories.name,
        created_at: sub_categories.created_at,
      })
      .from(sub_categories)
      .innerJoin(categories, eq(sub_categories.category_id, categories.id))
      .orderBy(sub_categories.name);

    return {
      categories: categoriesList,
      sub_categories: subCategoriesWithCategory,
      brands: brandsList,
      colors: colorsList,
      sizes: sizesList,
      materials: materialsList,
      styles: stylesList,
      fits: fitsList,
      patterns: patternsList,
    };
  },
};

