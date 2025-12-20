import { db } from "../db";
import { product_images, product_image_attributes, product_colors, product_sizes, product_materials, product_styles, product_fits, product_patterns, colors, sizes, materials, styles, fits, patterns } from "../db/schema";
import { eq, asc, and, sql } from "drizzle-orm";

export const productImageRepo = {
  /**
   * Create multiple product images
   */
  async createMany(productId: number, imageUrls: string[]) {
    if (imageUrls.length === 0) return [];

    const imagesToInsert = imageUrls.map((url, index) => ({
      product_id: productId,
      image_url: url,
      display_order: index,
    }));

    const inserted = await db
      .insert(product_images)
      .values(imagesToInsert)
      .returning();

    return inserted;
  },

  /**
   * Get all images for a product, ordered by display_order
   */
  async findByProductId(productId: number) {
    return await db
      .select()
      .from(product_images)
      .where(eq(product_images.product_id, productId))
      .orderBy(asc(product_images.display_order));
  },

  /**
   * Get all images for multiple products
   */
  async findByProductIds(productIds: number[]) {
    if (productIds.length === 0) return [];

    const { inArray } = await import("drizzle-orm");
    return await db
      .select()
      .from(product_images)
      .where(inArray(product_images.product_id, productIds))
      .orderBy(asc(product_images.display_order));
  },

  /**
   * Delete all images for a product
   * @returns Array of image URLs that were deleted (for R2 cleanup)
   */
  async deleteByProductId(productId: number): Promise<string[]> {
    // Get all image URLs before deleting
    const images = await this.findByProductId(productId);
    const imageUrls = images.map(img => img.image_url);
    
    // Delete from database
    await db.delete(product_images).where(eq(product_images.product_id, productId));
    
    return imageUrls;
  },

  /**
   * Delete specific image by ID
   * @returns Image URL that was deleted (for R2 cleanup), or null if not found
   */
  async deleteById(imageId: number): Promise<string | null> {
    // Get image URL before deleting
    const [image] = await db
      .select()
      .from(product_images)
      .where(eq(product_images.id, imageId))
      .limit(1);
    
    if (!image) {
      return null;
    }
    
    const imageUrl = image.image_url;
    
    // Delete from database
    await db.delete(product_images).where(eq(product_images.id, imageId));
    
    return imageUrl;
  },

  /**
   * Update display order of images
   */
  async updateDisplayOrder(imageId: number, displayOrder: number) {
    const [updated] = await db
      .update(product_images)
      .set({ display_order: displayOrder })
      .where(eq(product_images.id, imageId))
      .returning();
    return updated;
  },

  /**
   * Create image attribute mapping for a product image
   * @param imageId - The product image ID
   * @param productId - The product ID (needed to find product_color_id, etc.)
   * @param attributes - Optional attribute mappings (color, size, material, style, fit, pattern)
   */
  async createImageAttributeMapping(
    imageId: number,
    productId: number,
    attributes?: {
      color?: string | string[];
      size?: string | string[];
      material?: string | string[];
      style?: string | string[];
      fit?: string | string[];
      pattern?: string | string[];
    }
  ) {
    if (!attributes) return null;

    // Normalize all attributes to arrays for easier processing
    const colorValues = attributes.color ? (Array.isArray(attributes.color) ? attributes.color : [attributes.color]) : [];
    const sizeValues = attributes.size ? (Array.isArray(attributes.size) ? attributes.size : [attributes.size]) : [];
    const materialValues = attributes.material ? (Array.isArray(attributes.material) ? attributes.material : [attributes.material]) : [];
    const styleValues = attributes.style ? (Array.isArray(attributes.style) ? attributes.style : [attributes.style]) : [];
    const fitValues = attributes.fit ? (Array.isArray(attributes.fit) ? attributes.fit : [attributes.fit]) : [];
    const patternValues = attributes.pattern ? (Array.isArray(attributes.pattern) ? attributes.pattern : [attributes.pattern]) : [];

    // Helper to find product attribute ID by name (case-insensitive)
    const findProductAttributeId = async (
      attributeType: 'color' | 'size' | 'material' | 'style' | 'fit' | 'pattern',
      value: string
    ): Promise<number | null> => {
      const trimmedValue = value.trim();
      if (!trimmedValue) return null;
      
      try {
        if (attributeType === 'color') {
          const [productColor] = await db
            .select({ id: product_colors.id })
            .from(product_colors)
            .innerJoin(colors, eq(product_colors.color_id, colors.id))
            .where(and(
              eq(product_colors.product_id, productId),
              sql`LOWER(${colors.name}) = LOWER(${trimmedValue})`
            ))
            .limit(1);
          if (!productColor) {
            console.warn(`[Image ${imageId}] Product color not found: "${trimmedValue}" for product ${productId}`);
          }
          return productColor?.id || null;
        }
        
        if (attributeType === 'size') {
          const [productSize] = await db
            .select({ id: product_sizes.id })
            .from(product_sizes)
            .innerJoin(sizes, eq(product_sizes.size_id, sizes.id))
            .where(and(
              eq(product_sizes.product_id, productId),
              sql`LOWER(${sizes.name}) = LOWER(${trimmedValue})`
            ))
            .limit(1);
          if (!productSize) {
            console.warn(`[Image ${imageId}] Product size not found: "${trimmedValue}" for product ${productId}`);
          }
          return productSize?.id || null;
        }
        
        if (attributeType === 'material') {
          const [productMaterial] = await db
            .select({ id: product_materials.id })
            .from(product_materials)
            .innerJoin(materials, eq(product_materials.material_id, materials.id))
            .where(and(
              eq(product_materials.product_id, productId),
              sql`LOWER(${materials.name}) = LOWER(${trimmedValue})`
            ))
            .limit(1);
          if (!productMaterial) {
            console.warn(`[Image ${imageId}] Product material not found: "${trimmedValue}" for product ${productId}`);
          }
          return productMaterial?.id || null;
        }
        
        if (attributeType === 'style') {
          const [productStyle] = await db
            .select({ id: product_styles.id })
            .from(product_styles)
            .innerJoin(styles, eq(product_styles.style_id, styles.id))
            .where(and(
              eq(product_styles.product_id, productId),
              sql`LOWER(${styles.name}) = LOWER(${trimmedValue})`
            ))
            .limit(1);
          if (!productStyle) {
            console.warn(`[Image ${imageId}] Product style not found: "${trimmedValue}" for product ${productId}`);
          }
          return productStyle?.id || null;
        }
        
        if (attributeType === 'fit') {
          const [productFit] = await db
            .select({ id: product_fits.id })
            .from(product_fits)
            .innerJoin(fits, eq(product_fits.fit_id, fits.id))
            .where(and(
              eq(product_fits.product_id, productId),
              sql`LOWER(${fits.name}) = LOWER(${trimmedValue})`
            ))
            .limit(1);
          if (!productFit) {
            console.warn(`[Image ${imageId}] Product fit not found: "${trimmedValue}" for product ${productId}`);
          }
          return productFit?.id || null;
        }
        
        if (attributeType === 'pattern') {
          const [productPattern] = await db
            .select({ id: product_patterns.id })
            .from(product_patterns)
            .innerJoin(patterns, eq(product_patterns.pattern_id, patterns.id))
            .where(and(
              eq(product_patterns.product_id, productId),
              sql`LOWER(${patterns.name}) = LOWER(${trimmedValue})`
            ))
            .limit(1);
          if (!productPattern) {
            console.warn(`[Image ${imageId}] Product pattern not found: "${trimmedValue}" for product ${productId}`);
          }
          return productPattern?.id || null;
        }
      } catch (error) {
        // Log error but don't throw - just return null for this attribute
        console.error(`[Image ${imageId}] Error finding ${attributeType} attribute "${trimmedValue}" for product ${productId}:`, error);
        return null;
      }
      
      return null;
    };

    // Get all attribute IDs first (in parallel)
    const [
      colorIds,
      sizeIds,
      materialIds,
      styleIds,
      fitIds,
      patternIds,
    ] = await Promise.all([
      Promise.all(colorValues.map(v => findProductAttributeId('color', v))),
      Promise.all(sizeValues.map(v => findProductAttributeId('size', v))),
      Promise.all(materialValues.map(v => findProductAttributeId('material', v))),
      Promise.all(styleValues.map(v => findProductAttributeId('style', v))),
      Promise.all(fitValues.map(v => findProductAttributeId('fit', v))),
      Promise.all(patternValues.map(v => findProductAttributeId('pattern', v))),
    ]);

    const validColorIds = colorIds.filter((id): id is number => id !== null);
    const validSizeIds = sizeIds.filter((id): id is number => id !== null);
    const validMaterialIds = materialIds.filter((id): id is number => id !== null);
    const validStyleIds = styleIds.filter((id): id is number => id !== null);
    const validFitIds = fitIds.filter((id): id is number => id !== null);
    const validPatternIds = patternIds.filter((id): id is number => id !== null);

    console.log(`[Image ${imageId}] Attribute mapping - Colors: ${validColorIds.length}, Sizes: ${validSizeIds.length}, Materials: ${validMaterialIds.length}, Styles: ${validStyleIds.length}, Fits: ${validFitIds.length}, Patterns: ${validPatternIds.length}`);

    // Create one mapping row per attribute value
    // This allows the image to be associated with multiple attribute values independently
    const mappingsToInsert: Array<{
      product_image_id: number;
      product_color_id?: number;
      product_size_id?: number;
      product_material_id?: number;
      product_style_id?: number;
      product_fit_id?: number;
      product_pattern_id?: number;
    }> = [];

    // Add one row per color
    for (const colorId of validColorIds) {
      mappingsToInsert.push({
        product_image_id: imageId,
        product_color_id: colorId,
      });
    }

    // Add one row per size
    for (const sizeId of validSizeIds) {
      mappingsToInsert.push({
        product_image_id: imageId,
        product_size_id: sizeId,
      });
    }

    // Add one row per material
    for (const materialId of validMaterialIds) {
      mappingsToInsert.push({
        product_image_id: imageId,
        product_material_id: materialId,
      });
    }

    // Add one row per style
    for (const styleId of validStyleIds) {
      mappingsToInsert.push({
        product_image_id: imageId,
        product_style_id: styleId,
      });
    }

    // Add one row per fit
    for (const fitId of validFitIds) {
      mappingsToInsert.push({
        product_image_id: imageId,
        product_fit_id: fitId,
      });
    }

    // Add one row per pattern
    for (const patternId of validPatternIds) {
      mappingsToInsert.push({
        product_image_id: imageId,
        product_pattern_id: patternId,
      });
    }

    // If no individual attributes, but we want to create at least one mapping,
    // create a base mapping (though this shouldn't normally happen)
    if (mappingsToInsert.length === 0 && (colorValues.length > 0 || sizeValues.length > 0 || materialValues.length > 0 || styleValues.length > 0 || fitValues.length > 0 || patternValues.length > 0)) {
      // This case means attributes were provided but not found in the database
      // Skip creating mappings for invalid attributes
      return null;
    }

    // Create all mapping rows in batch
    if (mappingsToInsert.length > 0) {
      try {
        const created = await db
          .insert(product_image_attributes)
          .values(mappingsToInsert)
          .returning();
        console.log(`[Image ${imageId}] Successfully created ${created.length} attribute mapping(s)`);
        return created;
      } catch (error) {
        console.error(`[Image ${imageId}] Error inserting attribute mappings:`, error);
        console.error(`[Image ${imageId}] Mappings that failed:`, JSON.stringify(mappingsToInsert, null, 2));
        throw error; // Re-throw to ensure the error is visible
      }
    }

    if (colorValues.length > 0 || sizeValues.length > 0 || materialValues.length > 0 || styleValues.length > 0 || fitValues.length > 0 || patternValues.length > 0) {
      console.warn(`[Image ${imageId}] Attributes were provided but no valid mappings were found. Provided:`, {
        colors: colorValues,
        sizes: sizeValues,
        materials: materialValues,
        styles: styleValues,
        fits: fitValues,
        patterns: patternValues
      });
    }

    return null;
  },

  /**
   * Get attribute mappings for a product image
   */
  async getImageAttributeMappings(imageId: number) {
    const mappings = await db
      .select({
        id: product_image_attributes.id,
        product_color_id: product_image_attributes.product_color_id,
        product_size_id: product_image_attributes.product_size_id,
        product_material_id: product_image_attributes.product_material_id,
        product_style_id: product_image_attributes.product_style_id,
        product_fit_id: product_image_attributes.product_fit_id,
        product_pattern_id: product_image_attributes.product_pattern_id,
        color_name: colors.name,
        size_name: sizes.name,
        material_name: materials.name,
        style_name: styles.name,
        fit_name: fits.name,
        pattern_name: patterns.name,
      })
      .from(product_image_attributes)
      .leftJoin(product_colors, eq(product_image_attributes.product_color_id, product_colors.id))
      .leftJoin(colors, eq(product_colors.color_id, colors.id))
      .leftJoin(product_sizes, eq(product_image_attributes.product_size_id, product_sizes.id))
      .leftJoin(sizes, eq(product_sizes.size_id, sizes.id))
      .leftJoin(product_materials, eq(product_image_attributes.product_material_id, product_materials.id))
      .leftJoin(materials, eq(product_materials.material_id, materials.id))
      .leftJoin(product_styles, eq(product_image_attributes.product_style_id, product_styles.id))
      .leftJoin(styles, eq(product_styles.style_id, styles.id))
      .leftJoin(product_fits, eq(product_image_attributes.product_fit_id, product_fits.id))
      .leftJoin(fits, eq(product_fits.fit_id, fits.id))
      .leftJoin(product_patterns, eq(product_image_attributes.product_pattern_id, product_patterns.id))
      .leftJoin(patterns, eq(product_patterns.pattern_id, patterns.id))
      .where(eq(product_image_attributes.product_image_id, imageId));

    return mappings.map(m => ({
      id: m.id,
      attributes: {
        color: m.color_name || undefined,
        size: m.size_name || undefined,
        material: m.material_name || undefined,
        style: m.style_name || undefined,
        fit: m.fit_name || undefined,
        pattern: m.pattern_name || undefined,
      },
    }));
  },

  /**
   * Delete attribute mappings for a product image
   */
  async deleteImageAttributeMappings(imageId: number) {
    await db
      .delete(product_image_attributes)
      .where(eq(product_image_attributes.product_image_id, imageId));
  },
};

