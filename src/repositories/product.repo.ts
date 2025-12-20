import { db } from "../db";
import {
  product_images,
  products,
  categories,
  sub_categories,
  brands,
  colors,
  sizes,
  materials,
  styles,
  fits,
  patterns,
  product_categories,
  product_sub_categories,
  product_brands,
  product_colors,
  product_sizes,
  product_materials,
  product_styles,
  product_fits,
  product_patterns,
  product_image_attributes,
} from "../db/schema";
import { eq, desc, asc, sql, inArray, and, gte, lte, gt, or, ilike } from "drizzle-orm";
import { CreateProductInput, UpdateProductInput, ProductListInput } from "../dtos/product.dto";
import { productImageRepo } from "./productImage.repo";

/**
 * Helper functions to get or create attribute values
 */
async function getOrCreateCategory(name: string): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Category name is required');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, normalizedName))
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newCategory] = await db
    .insert(categories)
    .values({ name: normalizedName })
    .returning();
  
  return newCategory.id;
}

async function getOrCreateSubCategory(name: string, categoryId: number): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Sub category name is required');
  if (!categoryId) throw new Error('Category ID is required for sub category');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(sub_categories)
    .where(
      and(
        eq(sub_categories.name, normalizedName),
        eq(sub_categories.category_id, categoryId)
      )
    )
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newSubCategory] = await db
    .insert(sub_categories)
    .values({ name: normalizedName, category_id: categoryId })
    .returning();
  
  return newSubCategory.id;
}

async function getOrCreateBrand(name: string): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Brand name is required');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(brands)
    .where(eq(brands.name, normalizedName))
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newBrand] = await db
    .insert(brands)
    .values({ name: normalizedName })
    .returning();
  
  return newBrand.id;
}

async function getOrCreateColor(name: string): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Color name is required');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(colors)
    .where(eq(colors.name, normalizedName))
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newColor] = await db
    .insert(colors)
    .values({ name: normalizedName })
    .returning();
  
  return newColor.id;
}

async function getOrCreateSize(name: string): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Size name is required');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(sizes)
    .where(eq(sizes.name, normalizedName))
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newSize] = await db
    .insert(sizes)
    .values({ name: normalizedName })
    .returning();
  
  return newSize.id;
}

async function getOrCreateMaterial(name: string): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Material name is required');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(materials)
    .where(eq(materials.name, normalizedName))
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newMaterial] = await db
    .insert(materials)
    .values({ name: normalizedName })
    .returning();
  
  return newMaterial.id;
}

async function getOrCreateStyle(name: string): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Style name is required');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(styles)
    .where(eq(styles.name, normalizedName))
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newStyle] = await db
    .insert(styles)
    .values({ name: normalizedName })
    .returning();
  
  return newStyle.id;
}

async function getOrCreateFit(name: string): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Fit name is required');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(fits)
    .where(eq(fits.name, normalizedName))
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newFit] = await db
    .insert(fits)
    .values({ name: normalizedName })
    .returning();
  
  return newFit.id;
}

async function getOrCreatePattern(name: string): Promise<number> {
  if (!name || name.trim() === '') throw new Error('Pattern name is required');
  const normalizedName = name.trim();
  
  const [existing] = await db
    .select()
    .from(patterns)
    .where(eq(patterns.name, normalizedName))
    .limit(1);
  
  if (existing) return existing.id;
  
  const [newPattern] = await db
    .insert(patterns)
    .values({ name: normalizedName })
    .returning();
  
  return newPattern.id;
}

export const productRepo = {
  async create(input: CreateProductInput & { sku?: string }) {
    const insertData: any = {
      title: input.title,
      sku: input.sku || '', // SKU is required in schema, but will be generated in service
      base_price: input.base_price.toString(),
      stock: input.stock,
      description: input.description,
    };

    console.log("input", input);

    // Handle optional numeric fields - convert to string or null
    if (input.reseller_price !== undefined) {
      insertData.reseller_price = input.reseller_price !== null ? input.reseller_price.toString() : null;
    }
    if (input.retail_price !== undefined) {
      insertData.retail_price = input.retail_price !== null ? input.retail_price.toString() : null;
    }

    // Handle model (stays in products table)
    if (input.model !== undefined) insertData.model = input.model || null;
    if (input.is_featured !== undefined) insertData.isFeatured = input.is_featured;

    const [product] = await db.insert(products).values(insertData).returning();

    // Handle attribute mappings
    let categoryId: number | null = null;
    if (input.category) {
      categoryId = await getOrCreateCategory(input.category);
      await db.insert(product_categories).values({ product_id: product.id, category_id: categoryId });
    }
    if (input.sub_category) {
      if (!categoryId && input.category) {
        // If category was provided, use it
        categoryId = await getOrCreateCategory(input.category);
      }
      if (!categoryId) {
        throw new Error('Category is required when specifying a sub-category');
      }
      const subCategoryId = await getOrCreateSubCategory(input.sub_category, categoryId);
      await db.insert(product_sub_categories).values({ product_id: product.id, sub_category_id: subCategoryId });
    }
    // Handle multiple brands (support both array and single value for backward compatibility)
    const brands = (input as any).brands || (input.brand ? [input.brand] : []);
    if (brands.length > 0) {
      const brandIds = await Promise.all(brands.map((b: string) => getOrCreateBrand(b)));
      await db.insert(product_brands).values(
        brandIds.map(brandId => ({ product_id: product.id, brand_id: brandId }))
      );
    }
    
    // Handle multiple colors (support both array and single value for backward compatibility)
    const colors = (input as any).colors || (input.color ? [input.color] : []);
    if (colors.length > 0) {
      const colorIds = await Promise.all(colors.map((c: string) => getOrCreateColor(c)));
      await db.insert(product_colors).values(
        colorIds.map(colorId => ({ product_id: product.id, color_id: colorId }))
      );
    }
    
    // Handle multiple sizes
    const sizes = (input as any).sizes || (input.size ? [input.size] : []);
    if (sizes.length > 0) {
      const sizeIds = await Promise.all(sizes.map((s: string) => getOrCreateSize(s)));
      await db.insert(product_sizes).values(
        sizeIds.map(sizeId => ({ product_id: product.id, size_id: sizeId }))
      );
    }
    
    // Handle multiple materials
    const materials = (input as any).materials || (input.material ? [input.material] : []);
    if (materials.length > 0) {
      const materialIds = await Promise.all(materials.map((m: string) => getOrCreateMaterial(m)));
      await db.insert(product_materials).values(
        materialIds.map(materialId => ({ product_id: product.id, material_id: materialId }))
      );
    }
    
    // Handle multiple styles
    const styles = (input as any).styles || (input.style ? [input.style] : []);
    if (styles.length > 0) {
      const styleIds = await Promise.all(styles.map((s: string) => getOrCreateStyle(s)));
      await db.insert(product_styles).values(
        styleIds.map(styleId => ({ product_id: product.id, style_id: styleId }))
      );
    }
    
    // Handle multiple fits
    const fits = (input as any).fits || (input.fit ? [input.fit] : []);
    if (fits.length > 0) {
      const fitIds = await Promise.all(fits.map((f: string) => getOrCreateFit(f)));
      await db.insert(product_fits).values(
        fitIds.map(fitId => ({ product_id: product.id, fit_id: fitId }))
      );
    }
    
    // Handle multiple patterns
    const patterns = (input as any).patterns || (input.pattern ? [input.pattern] : []);
    if (patterns.length > 0) {
      const patternIds = await Promise.all(patterns.map((p: string) => getOrCreatePattern(p)));
      await db.insert(product_patterns).values(
        patternIds.map(patternId => ({ product_id: product.id, pattern_id: patternId }))
      );
    }

    // Handle images - support both legacy image_urls and new images format
    const imagesToInsert: Array<{ url: string; attributes?: any; displayOrder: number }> = [];
    
    // Legacy format: simple array of URLs
    if (input.image_urls && input.image_urls.length > 0) {
      input.image_urls.forEach((url, index) => {
        imagesToInsert.push({ url, displayOrder: index });
      });
    }
    
    // New format: images with optional attribute mappings
    if ((input as any).images && (input as any).images.length > 0) {
      let displayOrderOffset = imagesToInsert.length;
      (input as any).images.forEach((img: any, index: number) => {
        const url = typeof img === 'string' ? img : img.url;
        const attributes = typeof img === 'object' && img.attributes ? img.attributes : undefined;
        
        // Log if URL is missing but attributes are present (this shouldn't happen if controller is working correctly)
        if (!url && attributes) {
          console.warn(`[Product Create] Image at index ${displayOrderOffset} has attributes but no URL. Attributes:`, JSON.stringify(attributes));
        }
        
        // Only add if URL is present (images without URLs can't be inserted)
        if (url) {
          imagesToInsert.push({ url, attributes, displayOrder: displayOrderOffset++ });
        } else if (attributes) {
          console.error(`[Product Create] Skipping image at index ${index} - has attributes but no URL`);
        }
      });
    }
    
    // Insert images and create attribute mappings
    if (imagesToInsert.length > 0) {
      const insertedImages = await db.insert(product_images).values(
        imagesToInsert.map(img => ({
          product_id: product.id,
          image_url: img.url,
          display_order: img.displayOrder
        }))
      ).returning();
      
      // Create attribute mappings for images that have them in parallel
      // Use Promise.allSettled to ensure one failure doesn't block others
      const mappingPromises = insertedImages.map((image, i) => {
        const imageData = imagesToInsert[i];
        if (imageData.attributes) {
          console.log(`[Product ${product.id}] Creating attribute mapping for image ${image.id} (index ${i}) with attributes:`, JSON.stringify(imageData.attributes));
          return productImageRepo.createImageAttributeMapping(
            image.id,
            product.id,
            imageData.attributes
          ).catch((error) => {
            console.error(`[Product ${product.id}] Error creating attribute mapping for image ${image.id} (index ${i}):`, error);
            throw error; // Re-throw to be caught by Promise.allSettled
          });
        }
        return Promise.resolve(null);
      });
      
      const mappingResults = await Promise.allSettled(mappingPromises);
      
      // Log any failures but don't throw - we want to continue even if some mappings fail
      mappingResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[Product ${product.id}] Failed to create attribute mapping for image at index ${index}:`, result.reason);
        } else if (result.status === 'fulfilled' && result.value === null && imagesToInsert[index]?.attributes) {
          console.warn(`[Product ${product.id}] Attribute mapping returned null for image at index ${index} even though attributes were provided`);
        }
      });
    }
    
    return product;
  },

  async findById(id: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return null;

    // Fetch images first (needed for image IDs)
    const images = await db.select()
      .from(product_images)
      .where(eq(product_images.product_id, id))
      .orderBy(asc(product_images.display_order));
    
    const imageIds = images.map(img => img.id);

    // Fetch all remaining data in parallel
    const [
      imageAttributesData,
      productCategories,
      productSubCategories,
      productBrands,
      productColors,
      productSizes,
      productMaterials,
      productStyles,
      productFits,
      productPatterns,
    ] = await Promise.all([
      // Image attributes - single query for all images
      imageIds.length > 0
        ? db.select({
            image_id: product_image_attributes.product_image_id,
            color: colors.name,
            size: sizes.name,
            material: materials.name,
            style: styles.name,
            fit: fits.name,
            pattern: patterns.name,
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
          .where(inArray(product_image_attributes.product_image_id, imageIds))
        : [],
      
      // Attributes - all in parallel
      db.select({ id: categories.id, name: categories.name })
        .from(product_categories)
        .innerJoin(categories, eq(product_categories.category_id, categories.id))
        .where(eq(product_categories.product_id, id)),
      
      db.select({ id: sub_categories.id, name: sub_categories.name })
        .from(product_sub_categories)
        .innerJoin(sub_categories, eq(product_sub_categories.sub_category_id, sub_categories.id))
        .where(eq(product_sub_categories.product_id, id)),
      
      db.select({ id: brands.id, name: brands.name })
        .from(product_brands)
        .innerJoin(brands, eq(product_brands.brand_id, brands.id))
        .where(eq(product_brands.product_id, id)),
      
      db.select({ id: colors.id, name: colors.name })
        .from(product_colors)
        .innerJoin(colors, eq(product_colors.color_id, colors.id))
        .where(eq(product_colors.product_id, id)),
      
      db.select({ id: sizes.id, name: sizes.name })
        .from(product_sizes)
        .innerJoin(sizes, eq(product_sizes.size_id, sizes.id))
        .where(eq(product_sizes.product_id, id)),
      
      db.select({ id: materials.id, name: materials.name })
        .from(product_materials)
        .innerJoin(materials, eq(product_materials.material_id, materials.id))
        .where(eq(product_materials.product_id, id)),
      
      db.select({ id: styles.id, name: styles.name })
        .from(product_styles)
        .innerJoin(styles, eq(product_styles.style_id, styles.id))
        .where(eq(product_styles.product_id, id)),
      
      db.select({ id: fits.id, name: fits.name })
        .from(product_fits)
        .innerJoin(fits, eq(product_fits.fit_id, fits.id))
        .where(eq(product_fits.product_id, id)),
      
      db.select({ id: patterns.id, name: patterns.name })
        .from(product_patterns)
        .innerJoin(patterns, eq(product_patterns.pattern_id, patterns.id))
        .where(eq(product_patterns.product_id, id)),
    ]);

    // Build image attributes map
    const imageAttrMap = new Map<number, {
      color?: string;
      size?: string;
      material?: string;
      style?: string;
      fit?: string;
      pattern?: string;
    }>();
    
    imageAttributesData.forEach(attr => {
      if (!imageAttrMap.has(attr.image_id)) {
        imageAttrMap.set(attr.image_id, {});
      }
      const attrs = imageAttrMap.get(attr.image_id)!;
      if (attr.color) attrs.color = attr.color;
      if (attr.size) attrs.size = attr.size;
      if (attr.material) attrs.material = attr.material;
      if (attr.style) attrs.style = attr.style;
      if (attr.fit) attrs.fit = attr.fit;
      if (attr.pattern) attrs.pattern = attr.pattern;
    });

    // Build images with attributes
    const imagesWithAttributes = images.map(img => {
      const attrs = imageAttrMap.get(img.id);
      return {
        id: img.id,
        url: img.image_url,
        display_order: img.display_order,
        attributes: attrs && Object.keys(attrs).length > 0 ? attrs : undefined,
      };
    });

    return {
      ...product,
      images: imagesWithAttributes,
      // Single values
      category: productCategories[0]?.name || null,
      sub_category: productSubCategories[0]?.name || null,
      // Multiple values - return as arrays
      brands: productBrands.map(b => b.name),
      colors: productColors.map(c => c.name),
      sizes: productSizes.map(s => s.name),
      materials: productMaterials.map(m => m.name),
      styles: productStyles.map(s => s.name),
      fits: productFits.map(f => f.name),
      patterns: productPatterns.map(p => p.name),
    };
  },

  async update(id: number, input: UpdateProductInput) {
    const updateData: any = { ...input };
    
    // Remove image_urls and attributes from updateData as they're handled separately
    delete updateData.image_urls;
    delete updateData.category;
    delete updateData.sub_category;
    delete (updateData as any).brands;
    delete updateData.brand;
    // Remove both array and single value fields
    delete (updateData as any).colors;
    delete (updateData as any).sizes;
    delete (updateData as any).materials;
    delete (updateData as any).styles;
    delete (updateData as any).fits;
    delete (updateData as any).patterns;
    delete updateData.color;
    delete updateData.size;
    delete updateData.material;
    delete updateData.style;
    delete updateData.fit;
    delete updateData.pattern;
    
    // Handle numeric fields - convert to string
    if (input.base_price !== undefined) {
      updateData.base_price = input.base_price.toString();
    }
    if (input.reseller_price !== undefined) {
      updateData.reseller_price = input.reseller_price !== null ? input.reseller_price.toString() : null;
    }
    if (input.retail_price !== undefined) {
      updateData.retail_price = input.retail_price !== null ? input.retail_price.toString() : null;
    }
    
    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    // Handle attribute updates - delete existing and create new if provided
    let categoryId: number | null = null;
    if (input.category !== undefined) {
      await db.delete(product_categories).where(eq(product_categories.product_id, id));
      if (input.category) {
        categoryId = await getOrCreateCategory(input.category);
        await db.insert(product_categories).values({ product_id: id, category_id: categoryId });
      }
    }
    if (input.sub_category !== undefined) {
      await db.delete(product_sub_categories).where(eq(product_sub_categories.product_id, id));
      if (input.sub_category) {
        // Get categoryId - use provided category or fetch existing one
        if (!categoryId) {
          if (input.category) {
            categoryId = await getOrCreateCategory(input.category);
          } else {
            // Try to get existing category for this product
            const [existingCategory] = await db
              .select({ category_id: product_categories.category_id })
              .from(product_categories)
              .where(eq(product_categories.product_id, id))
              .limit(1);
            if (existingCategory) {
              categoryId = existingCategory.category_id;
            }
          }
        }
        if (!categoryId) {
          throw new Error('Category is required when specifying a sub-category');
        }
        const subCategoryId = await getOrCreateSubCategory(input.sub_category, categoryId);
        await db.insert(product_sub_categories).values({ product_id: id, sub_category_id: subCategoryId });
      }
    }
    // Handle attribute updates - batch getOrCreate operations, then execute deletes/inserts
    const attributeOps: Promise<void>[] = [];
    
    if ((input as any).brands !== undefined || input.brand !== undefined) {
      const brands = (input as any).brands || (input.brand ? [input.brand] : []);
      attributeOps.push((async () => {
        await db.delete(product_brands).where(eq(product_brands.product_id, id));
        if (brands.length > 0) {
          const brandIds = await Promise.all(brands.map((b: string) => getOrCreateBrand(b)));
          await db.insert(product_brands).values(
            brandIds.map(brandId => ({ product_id: id, brand_id: brandId }))
          );
        }
      })());
    }
    
    if ((input as any).colors !== undefined || input.color !== undefined) {
      const colors = (input as any).colors || (input.color ? [input.color] : []);
      attributeOps.push((async () => {
        await db.delete(product_colors).where(eq(product_colors.product_id, id));
        if (colors.length > 0) {
          const colorIds = await Promise.all(colors.map((c: string) => getOrCreateColor(c)));
          await db.insert(product_colors).values(
            colorIds.map(colorId => ({ product_id: id, color_id: colorId }))
          );
        }
      })());
    }
    
    if ((input as any).sizes !== undefined || input.size !== undefined) {
      const sizes = (input as any).sizes || (input.size ? [input.size] : []);
      attributeOps.push((async () => {
        await db.delete(product_sizes).where(eq(product_sizes.product_id, id));
        if (sizes.length > 0) {
          const sizeIds = await Promise.all(sizes.map((s: string) => getOrCreateSize(s)));
          await db.insert(product_sizes).values(
            sizeIds.map(sizeId => ({ product_id: id, size_id: sizeId }))
          );
        }
      })());
    }
    
    if ((input as any).materials !== undefined || input.material !== undefined) {
      const materials = (input as any).materials || (input.material ? [input.material] : []);
      attributeOps.push((async () => {
        await db.delete(product_materials).where(eq(product_materials.product_id, id));
        if (materials.length > 0) {
          const materialIds = await Promise.all(materials.map((m: string) => getOrCreateMaterial(m)));
          await db.insert(product_materials).values(
            materialIds.map(materialId => ({ product_id: id, material_id: materialId }))
          );
        }
      })());
    }
    
    if ((input as any).styles !== undefined || input.style !== undefined) {
      const styles = (input as any).styles || (input.style ? [input.style] : []);
      attributeOps.push((async () => {
        await db.delete(product_styles).where(eq(product_styles.product_id, id));
        if (styles.length > 0) {
          const styleIds = await Promise.all(styles.map((s: string) => getOrCreateStyle(s)));
          await db.insert(product_styles).values(
            styleIds.map(styleId => ({ product_id: id, style_id: styleId }))
          );
        }
      })());
    }
    
    if ((input as any).fits !== undefined || input.fit !== undefined) {
      const fits = (input as any).fits || (input.fit ? [input.fit] : []);
      attributeOps.push((async () => {
        await db.delete(product_fits).where(eq(product_fits.product_id, id));
        if (fits.length > 0) {
          const fitIds = await Promise.all(fits.map((f: string) => getOrCreateFit(f)));
          await db.insert(product_fits).values(
            fitIds.map(fitId => ({ product_id: id, fit_id: fitId }))
          );
        }
      })());
    }
    
    if ((input as any).patterns !== undefined || input.pattern !== undefined) {
      const patterns = (input as any).patterns || (input.pattern ? [input.pattern] : []);
      attributeOps.push((async () => {
        await db.delete(product_patterns).where(eq(product_patterns.product_id, id));
        if (patterns.length > 0) {
          const patternIds = await Promise.all(patterns.map((p: string) => getOrCreatePattern(p)));
          await db.insert(product_patterns).values(
            patternIds.map(patternId => ({ product_id: id, pattern_id: patternId }))
          );
        }
      })());
    }
    
    // Execute all attribute updates in parallel
    await Promise.all(attributeOps);

    // Handle images - support both legacy image_urls and new images format
    const imagesToInsert: Array<{ url: string; attributes?: any; displayOrder: number }> = [];
    
    // Get current max display_order to append new images
    const existingImages = await db
      .select()
      .from(product_images)
      .where(eq(product_images.product_id, id));
    
    const maxDisplayOrder = existingImages.length > 0
      ? Math.max(...existingImages.map(img => img.display_order || 0))
      : -1;
    
    // Legacy format: simple array of URLs
    if ((input as any).image_urls && (input as any).image_urls.length > 0) {
      (input as any).image_urls.forEach((url: string, index: number) => {
        imagesToInsert.push({ url, displayOrder: maxDisplayOrder + 1 + index });
      });
    }
    
    // New format: images with optional attribute mappings
    if ((input as any).images && (input as any).images.length > 0) {
      let displayOrderOffset = maxDisplayOrder + 1 + imagesToInsert.length;
      (input as any).images.forEach((img: any) => {
        const url = typeof img === 'string' ? img : img.url;
        const attributes = typeof img === 'object' && img.attributes ? img.attributes : undefined;
        imagesToInsert.push({ url, attributes, displayOrder: displayOrderOffset++ });
      });
    }
    
    // Insert images and create attribute mappings
    if (imagesToInsert.length > 0) {
      const insertedImages = await db.insert(product_images).values(
        imagesToInsert.map(img => ({
          product_id: id,
          image_url: img.url,
          display_order: img.displayOrder
        }))
      ).returning();
      
      // Create attribute mappings for images that have them in parallel
      await Promise.all(
        insertedImages.map((image, i) => {
          const imageData = imagesToInsert[i];
          if (imageData.attributes) {
            return productImageRepo.createImageAttributeMapping(
              image.id,
              id,
              imageData.attributes
            );
          }
          return Promise.resolve(null);
        })
      );
    }
    
    return product;
  },

  async delete(id: number) {
    // Get all images for this product before deleting
    const images = await productImageRepo.findByProductId(id);
    
    // Delete attribute mappings for each image (CASCADE will handle this, but explicit for clarity)
    for (const image of images) {
      await productImageRepo.deleteImageAttributeMappings(image.id);
    }
    
    // Delete all product images from R2 before deleting the product
    // (CASCADE will delete from database, but we need to clean up R2 manually)
    const imageUrls = await productImageRepo.deleteByProductId(id);
    
    // Delete images from R2 storage
    if (imageUrls.length > 0) {
      const { r2Service } = await import("../services/r2.service");
      await r2Service.deleteFiles(imageUrls);
    }
    
    // Delete product (this will cascade delete images from database)
    await db.delete(products).where(eq(products.id, id));
  },

  async deleteBulk(ids: number[]) {
    if (ids.length === 0) return { deleted: 0, failed: 0, errors: [] };
    
    const results = {
      deleted: 0,
      failed: 0,
      errors: [] as Array<{ id: number; error: string }>
    };
    
    // Get all images for all products in batch before deleting
    const allImageUrls: string[] = [];
    const productImageMap = new Map<number, number[]>(); // product_id -> image_ids
    
    // Fetch all images for all products in parallel
    const imagePromises = ids.map(async (id) => {
      try {
        const images = await productImageRepo.findByProductId(id);
        return { productId: id, images, error: null };
      } catch (error: any) {
        return { productId: id, images: [], error: error.message };
      }
    });
    
    const imageResults = await Promise.all(imagePromises);
    
    // Build map of product to image IDs and collect URLs
    const validIds: number[] = [];
    for (const { productId, images, error } of imageResults) {
      if (error) {
        results.failed++;
        results.errors.push({ id: productId, error });
        continue;
      }
      
      validIds.push(productId);
      const imageIds = images.map(img => img.id);
      productImageMap.set(productId, imageIds);
      
      // Collect image URLs for R2 cleanup
      const imageUrls = images.map(img => img.image_url);
      allImageUrls.push(...imageUrls);
    }
    
    // Delete attribute mappings for all images in parallel
    const attributeMappingPromises: Promise<void>[] = [];
    for (const [, imageIds] of productImageMap) {
      for (const imageId of imageIds) {
        attributeMappingPromises.push(
          productImageRepo.deleteImageAttributeMappings(imageId).catch(() => {
            // Ignore errors, continue with deletion
          })
        );
      }
    }
    await Promise.all(attributeMappingPromises);
    
    // Delete all products in batch (CASCADE will handle images in database)
    if (validIds.length > 0) {
      try {
        await db.delete(products).where(inArray(products.id, validIds));
        results.deleted = validIds.length;
      } catch (error: any) {
        // If batch delete fails, try individual deletes
        for (const id of validIds) {
          try {
            await db.delete(products).where(eq(products.id, id));
            results.deleted++;
          } catch (err: any) {
            results.failed++;
            results.errors.push({
              id,
              error: err.message || "Unknown error"
            });
          }
        }
      }
    }
    console.log("allImageUrls", allImageUrls);
    // Delete all images from R2 storage in batch (non-blocking)
    if (allImageUrls.length > 0) {
      // Don't await this - let it run in background to avoid blocking
      (async () => {
        try {
          const { r2Service } = await import("../services/r2.service");
          await r2Service.deleteFiles(allImageUrls);
        } catch (error: any) {
          // Log error but don't fail the operation
          console.error("Failed to delete some images from R2:", error.message);
        }
      })();
    }
    
    return results;
  },

  async list(input: ProductListInput) {
    const offset = (input.page - 1) * input.limit;
  
    /* ------------------------------------------------------------------
       1️⃣ Helper: EXISTS-based attribute filter (VERY FAST)
    ------------------------------------------------------------------ */
    const existsAttr = (
      joinTable: any,
      valueTable: any,
      joinCol: any,
      value: string
    ) => sql`
      EXISTS (
        SELECT 1
        FROM ${joinTable} jt
        JOIN ${valueTable} vt ON vt.id = jt.${joinCol}
        WHERE jt.product_id = ${products.id}
        AND vt.name ILIKE ${`%${value}%`}
      )
    `;
  
    /* ------------------------------------------------------------------
       2️⃣ Build WHERE conditions
    ------------------------------------------------------------------ */
    const conditions: any[] = [];
  
    // Search
    if (input.search) {
      conditions.push(
        sql`${products.title} ILIKE ${`%${input.search}%`}
        OR ${products.sku} ILIKE ${`%${input.search}%`}`
      );
    }
  
    // Flags
    if (input.is_featured !== undefined) {
      conditions.push(eq(products.isFeatured, input.is_featured));
    }
  
    // Price (cast to decimal for comparison)
    if (input.min_price !== undefined) {
      conditions.push(gte(sql`CAST(${products.base_price} AS DECIMAL)`, input.min_price));
    }
    if (input.max_price !== undefined) {
      conditions.push(lte(sql`CAST(${products.base_price} AS DECIMAL)`, input.max_price));
    }
  
    // Stock
    if (input.in_stock) {
      conditions.push(gt(products.stock, 0));
    }
  
    /* ------------------------------------------------------------------
       3️⃣ Attribute filters (ALL SQL-LEVEL)
    ------------------------------------------------------------------ */
    if (input.category)
      conditions.push(existsAttr(product_categories, categories, "category_id", input.category));
  
    if (input.sub_category)
      conditions.push(existsAttr(product_sub_categories, sub_categories, "sub_category_id", input.sub_category));
  
    if (input.brand)
      conditions.push(existsAttr(product_brands, brands, "brand_id", input.brand));
  
    if (input.color)
      conditions.push(existsAttr(product_colors, colors, "color_id", input.color));
  
    if (input.size)
      conditions.push(existsAttr(product_sizes, sizes, "size_id", input.size));
  
    if (input.material)
      conditions.push(existsAttr(product_materials, materials, "material_id", input.material));
  
    if (input.style)
      conditions.push(existsAttr(product_styles, styles, "style_id", input.style));
  
    const whereClause = conditions.length ? and(...conditions) : undefined;
  
    /* ------------------------------------------------------------------
       4️⃣ Sorting
    ------------------------------------------------------------------ */
    const sortDir = input.sort_order === "asc" ? asc : desc;
  
    const orderBy = (() => {
      switch (input.sort_by) {
        case "base_price": return sortDir(products.base_price);
        case "title": return sortDir(products.title);
        case "stock": return sortDir(products.stock);
        default: return sortDir(products.created_at);
      }
    })();
  
    /* ------------------------------------------------------------------
       5️⃣ Fetch products + count (FAST)
    ------------------------------------------------------------------ */
    const [items, [{ count }]] = await Promise.all([
      db.select()
        .from(products)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(offset),
  
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause)
    ]);
  
    if (!items.length) {
      return {
        products: [],
        total: 0,
        page: input.page,
        limit: input.limit,
        totalPages: 0,
      };
    }
  
    const productIds = items.map(p => p.id);
  
    /* ------------------------------------------------------------------
       6️⃣ Fetch ALL relations in parallel
    ------------------------------------------------------------------ */
    const [
      images,
      imageAttrs,
      brandsData,
      colorsData,
      sizesData,
      materialsData,
      stylesData,
      fitsData,
      patternsData,
    ] = await Promise.all([
    
      // ---------------- IMAGES ----------------
      db.select()
        .from(product_images)
        .where(inArray(product_images.product_id, productIds))
        .orderBy(asc(product_images.display_order)),
    
      // -------- IMAGE ATTRIBUTES --------------
      db.select({
        image_id: product_image_attributes.product_image_id,
        color: colors.name,
        size: sizes.name,
        material: materials.name,
        style: styles.name,
        fit: fits.name,
        pattern: patterns.name,
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
      .leftJoin(patterns, eq(product_patterns.pattern_id, patterns.id)),
    
      // --------------- CATEGORY ----------------
      db.select({
        product_id: product_categories.product_id,
        name: categories.name,
      })
      .from(product_categories)
      .innerJoin(categories, eq(product_categories.category_id, categories.id))
      .where(inArray(product_categories.product_id, productIds)),
    
      // ------------ SUB CATEGORY ---------------
      db.select({
        product_id: product_sub_categories.product_id,
        name: sub_categories.name,
      })
      .from(product_sub_categories)
      .innerJoin(sub_categories, eq(product_sub_categories.sub_category_id, sub_categories.id))
      .where(inArray(product_sub_categories.product_id, productIds)),
    
      // ---------------- BRAND ------------------
      db.select({
        product_id: product_brands.product_id,
        name: brands.name,
      })
      .from(product_brands)
      .innerJoin(brands, eq(product_brands.brand_id, brands.id))
      .where(inArray(product_brands.product_id, productIds)),
    
      // ---------------- COLOR ------------------
      db.select({
        product_id: product_colors.product_id,
        name: colors.name,
      })
      .from(product_colors)
      .innerJoin(colors, eq(product_colors.color_id, colors.id))
      .where(inArray(product_colors.product_id, productIds)),
    
      // ---------------- SIZE -------------------
      db.select({
        product_id: product_sizes.product_id,
        name: sizes.name,
      })
      .from(product_sizes)
      .innerJoin(sizes, eq(product_sizes.size_id, sizes.id))
      .where(inArray(product_sizes.product_id, productIds)),
    
      // -------------- MATERIAL -----------------
      db.select({
        product_id: product_materials.product_id,
        name: materials.name,
      })
      .from(product_materials)
      .innerJoin(materials, eq(product_materials.material_id, materials.id))
      .where(inArray(product_materials.product_id, productIds)),
    
      // ---------------- STYLE ------------------
      db.select({
        product_id: product_styles.product_id,
        name: styles.name,
      })
      .from(product_styles)
      .innerJoin(styles, eq(product_styles.style_id, styles.id))
      .where(inArray(product_styles.product_id, productIds)),
    
      // ---------------- FIT --------------------
      db.select({
        product_id: product_fits.product_id,
        name: fits.name,
      })
      .from(product_fits)
      .innerJoin(fits, eq(product_fits.fit_id, fits.id))
      .where(inArray(product_fits.product_id, productIds)),
    
      // -------------- PATTERN ------------------
      db.select({
        product_id: product_patterns.product_id,
        name: patterns.name,
      })
      .from(product_patterns)
      .innerJoin(patterns, eq(product_patterns.pattern_id, patterns.id))
      .where(inArray(product_patterns.product_id, productIds)),
    ]);
    
  
    /* ------------------------------------------------------------------
       7️⃣ Utility: group by product
    ------------------------------------------------------------------ */
    const group = (rows: any[], key: string, val: string) => {
      const m = new Map<number, string[]>();
      rows.forEach(r => {
        const arr = m.get(r[key]) || [];
        if (!arr.includes(r[val])) arr.push(r[val]);
        m.set(r[key], arr);
      });
      return m;
    };
  
    const brandMap = group(brandsData, "product_id", "name");
    const colorMap = group(colorsData, "product_id", "name");
    const sizeMap = group(sizesData, "product_id", "name");
    const materialMap = group(materialsData, "product_id", "name");
    const styleMap = group(stylesData, "product_id", "name");
    const fitMap = group(fitsData, "product_id", "name");
    const patternMap = group(patternsData, "product_id", "name");
  
    /* ------------------------------------------------------------------
       8️⃣ Images + attributes
    ------------------------------------------------------------------ */
    const imageMap = new Map<number, any[]>();
    images.forEach(img => {
      imageMap.set(img.product_id, [...(imageMap.get(img.product_id) || []), {
        id: img.id,
        url: img.image_url,
        display_order: img.display_order,
        attributes: {},
      }]);
    });
  
    imageAttrs.forEach(a => {
      imageMap.forEach(list => {
        const img = list.find(i => i.id === a.image_id);
        if (!img) return;
        Object.entries(a).forEach(([k, v]) => {
          if (!v || k === 'image_id') return; // Skip null/undefined values and image_id
          
          // Initialize as array if not exists
          if (!img.attributes[k]) {
            img.attributes[k] = [];
          }
          
          // Ensure it's an array (convert if it was set as a single value previously)
          if (!Array.isArray(img.attributes[k])) {
            img.attributes[k] = [img.attributes[k]];
          }
          
          // Add value if not already present
          if (!img.attributes[k].includes(v)) {
            img.attributes[k].push(v);
          }
        });
      });
    });
    
    // Convert single-item arrays to single values for backward compatibility with existing API format
    imageMap.forEach(list => {
      list.forEach(img => {
        Object.keys(img.attributes).forEach(k => {
          if (Array.isArray(img.attributes[k])) {
            if (img.attributes[k].length === 1) {
              img.attributes[k] = img.attributes[k][0];
            }
            // If length > 1, keep as array to show all values
          }
        });
      });
    });
  
    // Aggregate image attributes by product (available options)
    const imageAttrMap = new Map<number, {
      availableColors: Set<string>;
      availableSizes: Set<string>;
      availableMaterials: Set<string>;
      availableStyles: Set<string>;
      availableFits: Set<string>;
      availablePatterns: Set<string>;
    }>();
    
    images.forEach(img => {
      if (!imageAttrMap.has(img.product_id)) {
        imageAttrMap.set(img.product_id, {
          availableColors: new Set(),
          availableSizes: new Set(),
          availableMaterials: new Set(),
          availableStyles: new Set(),
          availableFits: new Set(),
          availablePatterns: new Set(),
        });
      }
    });
    
    imageAttrs.forEach(attr => {
      // Find which product this image belongs to
      const productImage = images.find(img => img.id === attr.image_id);
      if (!productImage) return;
      
      const attrs = imageAttrMap.get(productImage.product_id);
      if (!attrs) return;
      
      if (attr.color) attrs.availableColors.add(attr.color);
      if (attr.size) attrs.availableSizes.add(attr.size);
      if (attr.material) attrs.availableMaterials.add(attr.material);
      if (attr.style) attrs.availableStyles.add(attr.style);
      if (attr.fit) attrs.availableFits.add(attr.fit);
      if (attr.pattern) attrs.availablePatterns.add(attr.pattern);
    });
  
    /* ------------------------------------------------------------------
       9️⃣ Final response
    ------------------------------------------------------------------ */
    return {
      products: items.map(p => {
        const imageAttrs = imageAttrMap.get(p.id);
        return {
          ...p,
          brands: brandMap.get(p.id) || [],
          colors: colorMap.get(p.id) || [],
          sizes: sizeMap.get(p.id) || [],
          materials: materialMap.get(p.id) || [],
          styles: styleMap.get(p.id) || [],
          fits: fitMap.get(p.id) || [],
          patterns: patternMap.get(p.id) || [],
          images: imageMap.get(p.id) || [],
          imageAttributes: imageAttrs ? {
            availableColors: Array.from(imageAttrs.availableColors),
            availableSizes: Array.from(imageAttrs.availableSizes),
            availableMaterials: Array.from(imageAttrs.availableMaterials),
            availableStyles: Array.from(imageAttrs.availableStyles),
            availableFits: Array.from(imageAttrs.availableFits),
            availablePatterns: Array.from(imageAttrs.availablePatterns),
          } : undefined,
        };
      }),
      total: Number(count),
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(Number(count) / input.limit),
    };
  },

  async findAll() {
    return await db.select().from(products).orderBy(desc(products.created_at));
  },

  /**
   * Optimized bulk insert using batch processing
   * Inserts in chunks to avoid memory issues and improve performance
   */
  async createBulk(inputs: (CreateProductInput & { sku?: string; reseller_price?: number; retail_price?: number; image_urls?: string[] })[], batchSize: number = 500) {
    const results: any[] = [];
    
    // Process in batches to optimize memory and performance
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      
      // Prepare batch data - only include fields that exist in products table
      const batchData = batch.map(input => {
        const insertData: any = {
          title: input.title,
          sku: input.sku || '', // SKU is required in schema
          base_price: input.base_price.toString(),
          stock: input.stock,
          description: input.description,
        };

        // Handle optional numeric fields - convert to string or null
        if (input.reseller_price !== undefined) {
          insertData.reseller_price = input.reseller_price !== null ? input.reseller_price.toString() : null;
        }
        if (input.retail_price !== undefined) {
          insertData.retail_price = input.retail_price !== null ? input.retail_price.toString() : null;
        }

        // Handle model (stays in products table)
        if (input.model !== undefined) insertData.model = input.model || null;
        if (input.is_featured !== undefined) insertData.isFeatured = input.is_featured;

        return insertData;
      });

      // Insert batch
      const inserted = await db
        .insert(products)
        .values(batchData)
        .returning();

      // Handle attributes and images separately for each product
      for (let j = 0; j < batch.length; j++) {
        const input = batch[j];
        const product = inserted[j];
        
        // Handle attribute mappings
        let categoryId: number | null = null;
        if (input.category) {
          categoryId = await getOrCreateCategory(input.category);
          await db.insert(product_categories).values({ product_id: product.id, category_id: categoryId });
        }
        if (input.sub_category) {
          if (!categoryId && input.category) {
            categoryId = await getOrCreateCategory(input.category);
          }
          if (!categoryId) {
            throw new Error(`Category is required when specifying a sub-category for product: ${input.title}`);
          }
          const subCategoryId = await getOrCreateSubCategory(input.sub_category, categoryId);
          await db.insert(product_sub_categories).values({ product_id: product.id, sub_category_id: subCategoryId });
        }
        // Handle multiple brands (support both array and single value)
        const brands = (input as any).brands || (input.brand ? [input.brand] : []);
        if (brands.length > 0) {
          const brandIds = await Promise.all(brands.map((b: string) => getOrCreateBrand(b)));
          await db.insert(product_brands).values(
            brandIds.map(brandId => ({ product_id: product.id, brand_id: brandId }))
          );
        }
        
        // Handle multiple colors (support both array and single value)
        const colors = (input as any).colors || (input.color ? [input.color] : []);
        if (colors.length > 0) {
          const colorIds = await Promise.all(colors.map((c: string) => getOrCreateColor(c)));
          await db.insert(product_colors).values(
            colorIds.map(colorId => ({ product_id: product.id, color_id: colorId }))
          );
        }
        
        // Handle multiple sizes
        const sizes = (input as any).sizes || (input.size ? [input.size] : []);
        if (sizes.length > 0) {
          const sizeIds = await Promise.all(sizes.map((s: string) => getOrCreateSize(s)));
          await db.insert(product_sizes).values(
            sizeIds.map(sizeId => ({ product_id: product.id, size_id: sizeId }))
          );
        }
        
        // Handle multiple materials
        const materials = (input as any).materials || (input.material ? [input.material] : []);
        if (materials.length > 0) {
          const materialIds = await Promise.all(materials.map((m: string) => getOrCreateMaterial(m)));
          await db.insert(product_materials).values(
            materialIds.map(materialId => ({ product_id: product.id, material_id: materialId }))
          );
        }
        
        // Handle multiple styles
        const styles = (input as any).styles || (input.style ? [input.style] : []);
        if (styles.length > 0) {
          const styleIds = await Promise.all(styles.map((s: string) => getOrCreateStyle(s)));
          await db.insert(product_styles).values(
            styleIds.map(styleId => ({ product_id: product.id, style_id: styleId }))
          );
        }
        
        // Handle multiple fits
        const fits = (input as any).fits || (input.fit ? [input.fit] : []);
        if (fits.length > 0) {
          const fitIds = await Promise.all(fits.map((f: string) => getOrCreateFit(f)));
          await db.insert(product_fits).values(
            fitIds.map(fitId => ({ product_id: product.id, fit_id: fitId }))
          );
        }
        
        // Handle multiple patterns
        const patterns = (input as any).patterns || (input.pattern ? [input.pattern] : []);
        if (patterns.length > 0) {
          const patternIds = await Promise.all(patterns.map((p: string) => getOrCreatePattern(p)));
          await db.insert(product_patterns).values(
            patternIds.map(patternId => ({ product_id: product.id, pattern_id: patternId }))
          );
        }
        
        // Handle images - support both legacy image_urls and new images format
        const imagesToInsert: Array<{ url: string; attributes?: any; displayOrder: number }> = [];
        
        // Legacy format: simple array of URLs
        if (input.image_urls && input.image_urls.length > 0) {
          input.image_urls.forEach((url, index) => {
            imagesToInsert.push({ url, displayOrder: index });
          });
        }
        
        // New format: images with optional attribute mappings
        if ((input as any).images && (input as any).images.length > 0) {
          let displayOrderOffset = imagesToInsert.length;
          (input as any).images.forEach((img: any) => {
            const url = typeof img === 'string' ? img : img.url;
            const attributes = typeof img === 'object' && img.attributes ? img.attributes : undefined;
            imagesToInsert.push({ url, attributes, displayOrder: displayOrderOffset++ });
          });
        }
        
        // Insert images and create attribute mappings
        if (imagesToInsert.length > 0) {
          const insertedImages = await db.insert(product_images).values(
            imagesToInsert.map(img => ({
              product_id: product.id,
              image_url: img.url,
              display_order: img.displayOrder
            }))
          ).returning();
          
          // Create attribute mappings for images that have them
          for (let i = 0; i < insertedImages.length; i++) {
            const image = insertedImages[i];
            const imageData = imagesToInsert[i];
            if (imageData.attributes) {
              await productImageRepo.createImageAttributeMapping(
                image.id,
                product.id,
                imageData.attributes
              );
            }
          }
        }
      }

      results.push(...inserted);
    }

    return results;
  },

  /**
   * Check if SKUs exist in database (optimized batch check)
   */
  async findExistingSKUs(skus: string[]): Promise<Set<string>> {
    if (skus.length === 0) return new Set();
    // Use IN clause for efficient batch lookup
    const existing = await db.select().from(products).where(inArray(products.sku, skus));

    return new Set(existing.map(p => p.sku));
  }
};

