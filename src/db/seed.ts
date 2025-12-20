import { db } from "./index";
import { eq, and } from "drizzle-orm";
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
} from "./schema";

/**
 * Helper function to safely insert values, checking existence first
 */
async function safeInsert<T extends { name: string }>(
  table: any,
  data: T[],
  tableName: string
) {
  let inserted = 0;
  let skipped = 0;
  
  for (const item of data) {
    // Check if item already exists
    const [existing] = await db
      .select()
      .from(table)
      .where(eq(table.name, item.name))
      .limit(1);
    
    if (existing) {
      // Item already exists, skip it
      skipped++;
      continue;
    }
    
    // Item doesn't exist, insert it
    try {
      await db.insert(table).values(item);
      inserted++;
    } catch (error: any) {
      console.error(`Error inserting ${tableName} "${item.name}":`, error);
      throw error;
    }
  }
  
  console.log(`✅ ${tableName}: Inserted ${inserted}, Skipped ${skipped} (existing), Total: ${data.length}`);
}

/**
 * Seed script to populate attribute tables with initial data
 * Run with: bun run src/db/seed.ts
 */
async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Seed Categories
    console.log("📦 Seeding categories...");
    const categoryData = [
      "Timepieces",
      "Leather Goods",
      "Accessories",
      "Jewelry",
      "Apparel",
      "Footwear",
      "Bags",
    ];
    
    // Insert categories and get their IDs (check existence first)
    const categoryMap = new Map<string, number>();
    let categoriesInserted = 0;
    let categoriesSkipped = 0;
    
    for (const name of categoryData) {
      // Check if category already exists
      const [existing] = await db
        .select()
        .from(categories)
        .where(eq(categories.name, name))
        .limit(1);
      
      if (existing) {
        // Category already exists, use existing ID
        categoryMap.set(name, existing.id);
        categoriesSkipped++;
      } else {
        // Category doesn't exist, insert it
        try {
          const [inserted] = await db.insert(categories).values({ name }).returning();
          categoryMap.set(name, inserted.id);
          categoriesInserted++;
        } catch (error: any) {
          console.error(`Error inserting category "${name}":`, error);
          throw error;
        }
      }
    }
    console.log(`✅ Categories: Inserted ${categoriesInserted}, Skipped ${categoriesSkipped} (existing), Total: ${categoryData.length}`);

    // Seed Sub Categories - mapped to their categories
    console.log("📦 Seeding sub categories...");
    const subCategoryMapping: Array<{ name: string; category: string }> = [
      // Timepieces
      { name: "Watches", category: "Timepieces" },
      { name: "Smartwatches", category: "Timepieces" },
      { name: "Pocket Watches", category: "Timepieces" },
      
      // Leather Goods
      { name: "Handbags", category: "Leather Goods" },
      { name: "Wallets", category: "Leather Goods" },
      { name: "Belts", category: "Leather Goods" },
      { name: "Briefcases", category: "Leather Goods" },
      
      // Accessories
      { name: "Sunglasses", category: "Accessories" },
      { name: "Backpacks", category: "Accessories" },
      { name: "Hats", category: "Accessories" },
      { name: "Scarves", category: "Accessories" },
      
      // Jewelry
      { name: "Necklaces", category: "Jewelry" },
      { name: "Bracelets", category: "Jewelry" },
      { name: "Rings", category: "Jewelry" },
      { name: "Earrings", category: "Jewelry" },
      { name: "Pendants", category: "Jewelry" },
      
      // Apparel
      { name: "Shirts", category: "Apparel" },
      { name: "Pants", category: "Apparel" },
      { name: "Dresses", category: "Apparel" },
      { name: "Jackets", category: "Apparel" },
      { name: "T-Shirts", category: "Apparel" },
      
      // Footwear
      { name: "Sneakers", category: "Footwear" },
      { name: "Boots", category: "Footwear" },
      { name: "Sandals", category: "Footwear" },
      { name: "Loafers", category: "Footwear" },
      
      // Bags
      { name: "Tote Bags", category: "Bags" },
      { name: "Clutches", category: "Bags" },
      { name: "Crossbody Bags", category: "Bags" },
      { name: "Shoulder Bags", category: "Bags" },
    ];
    
    let insertedSubCategories = 0;
    let skippedSubCategories = 0;
    
    for (const { name, category } of subCategoryMapping) {
      const categoryId = categoryMap.get(category);
      if (!categoryId) {
        console.warn(`⚠️  Category "${category}" not found for sub-category "${name}"`);
        continue;
      }
      
      // Check if sub-category already exists for this category
      const [existing] = await db
        .select()
        .from(sub_categories)
        .where(
          and(
            eq(sub_categories.name, name),
            eq(sub_categories.category_id, categoryId)
          )
        )
        .limit(1);
      
      if (existing) {
        // Sub-category already exists, skip it
        skippedSubCategories++;
        continue;
      }
      
      // Sub-category doesn't exist, insert it
      try {
        await db.insert(sub_categories).values({ name, category_id: categoryId });
        insertedSubCategories++;
      } catch (error: any) {
        console.error(`Error inserting sub-category "${name}":`, error);
        throw error;
      }
    }
    console.log(`✅ Sub Categories: Inserted ${insertedSubCategories}, Skipped ${skippedSubCategories} (existing), Total: ${subCategoryMapping.length}`);

    // Seed Brands
    console.log("📦 Seeding brands...");
    const brandData = [
      "Rolex",
      "Omega",
      "TAG Heuer",
      "Cartier",
      "Patek Philippe",
      "Louis Vuitton",
      "Gucci",
      "Prada",
      "Hermès",
      "Chanel",
      "Dior",
      "Versace",
      "Armani",
      "Tom Ford",
      "Burberry",
      "Coach",
      "Michael Kors",
      "Kate Spade",
      "Tiffany & Co.",
      "Bulgari",
    ];
    await safeInsert(brands, brandData.map(name => ({ name })), "brands");

    // Seed Colors
    console.log("📦 Seeding colors...");
    const colorData = [
      "Black",
      "White",
      "Silver",
      "Gold",
      "Rose Gold",
      "Brown",
      "Tan",
      "Beige",
      "Navy",
      "Blue",
      "Red",
      "Green",
      "Pink",
      "Purple",
      "Gray",
      "Grey",
      "Ivory",
      "Cream",
      "Burgundy",
      "Maroon",
      "Orange",
      "Yellow",
      "Teal",
      "Turquoise",
      "Copper",
      "Bronze",
      "Platinum",
      "Stainless Steel",
    ];
    await safeInsert(colors, colorData.map(name => ({ name })), "colors");

    // Seed Sizes
    console.log("📦 Seeding sizes...");
    const sizeData = [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "XXXL",
      "28mm",
      "32mm",
      "36mm",
      "38mm",
      "40mm",
      "42mm",
      "44mm",
      "46mm",
      "48mm",
      "Small",
      "Medium",
      "Large",
      "Extra Large",
      "One Size",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
    ];
    await safeInsert(sizes, sizeData.map(name => ({ name })), "sizes");

    // Seed Materials
    console.log("📦 Seeding materials...");
    const materialData = [
      "Leather",
      "Genuine Leather",
      "Full Grain Leather",
      "Top Grain Leather",
      "Suede",
      "Canvas",
      "Cotton",
      "Silk",
      "Wool",
      "Cashmere",
      "Polyester",
      "Nylon",
      "Stainless Steel",
      "Titanium",
      "Gold",
      "Silver",
      "Platinum",
      "Rose Gold",
      "Diamond",
      "Pearl",
      "Rubber",
      "Plastic",
      "Wood",
      "Carbon Fiber",
      "Aluminum",
      "Brass",
      "Copper",
      "Ceramic",
    ];
    await safeInsert(materials, materialData.map(name => ({ name })), "materials");

    // Seed Styles
    console.log("📦 Seeding styles...");
    const styleData = [
      "Classic",
      "Modern",
      "Vintage",
      "Contemporary",
      "Minimalist",
      "Luxury",
      "Sporty",
      "Casual",
      "Formal",
      "Business",
      "Elegant",
      "Bold",
      "Sophisticated",
      "Trendy",
      "Timeless",
      "Chic",
      "Bohemian",
      "Streetwear",
      "Athletic",
      "Designer",
    ];
    await safeInsert(styles, styleData.map(name => ({ name })), "styles");

    // Seed Fits
    console.log("📦 Seeding fits...");
    const fitData = [
      "Regular",
      "Slim",
      "Loose",
      "Fitted",
      "Oversized",
      "Relaxed",
      "Tight",
      "Comfortable",
      "Tailored",
      "Standard",
      "Athletic",
      "Straight",
      "Skinny",
      "Wide",
      "Narrow",
      "Medium",
    ];
    await safeInsert(fits, fitData.map(name => ({ name })), "fits");

    // Seed Patterns
    console.log("📦 Seeding patterns...");
    const patternData = [
      "Solid",
      "Striped",
      "Checkered",
      "Plaid",
      "Polka Dot",
      "Floral",
      "Geometric",
      "Abstract",
      "Animal Print",
      "Paisley",
      "Damask",
      "Houndstooth",
      "Herringbone",
      "Twill",
      "Jacquard",
      "Embossed",
      "Textured",
      "Smooth",
      "Matte",
      "Glossy",
    ];
    await safeInsert(patterns, patternData.map(name => ({ name })), "patterns");

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("✅ Seed script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });

