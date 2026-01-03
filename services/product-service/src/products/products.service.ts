import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createProductDto: CreateProductDto) {
    // Generate slug if not provided
    const slug =
      createProductDto.slug || this.generateSlug(createProductDto.name);

    // Check if slug exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this slug already exists');
    }

    // Check SKU uniqueness if provided
    if (createProductDto.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: createProductDto.sku },
      });

      if (existingSku) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Use transaction to create product with all related data
    const product = await this.prisma.$transaction(async (tx) => {
      // Create the product first
      const newProduct = await tx.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description,
          slug,
          sku: createProductDto.sku,
          categoryId: createProductDto.categoryId,
          isActive: createProductDto.isActive ?? true,
          images: createProductDto.images
            ? {
                create: createProductDto.images.map((image) => ({
                  url: image.url,
                  alt: image.alt,
                  order: image.order ?? 0,
                  isPrimary: image.isPrimary ?? false,
                })),
              }
            : undefined,
        },
      });

      // Create variant options and their values if provided
      const optionValueMap = new Map<string, string>(); // "Color:Red" -> optionValueId

      if (createProductDto.options && createProductDto.options.length > 0) {
        for (const option of createProductDto.options) {
          const createdOption = await tx.variantOption.create({
            data: {
              productId: newProduct.id,
              name: option.name,
              position: option.position ?? 0,
              values: {
                create: option.values.map((v, idx) => ({
                  value: v.value,
                  position: v.position ?? idx,
                })),
              },
            },
            include: {
              values: true,
            },
          });

          // Build the lookup map
          for (const value of createdOption.values) {
            optionValueMap.set(`${option.name}:${value.value}`, value.id);
          }
        }
      }

      // Create variants with their option value connections
      if (createProductDto.variants && createProductDto.variants.length > 0) {
        for (const variant of createProductDto.variants) {
          // Auto-generate variant name from option values if not provided
          let variantName = variant.name;
          if (!variantName && variant.optionValues) {
            variantName = variant.optionValues.map((ov) => ov.value).join(' / ');
          }
          if (!variantName) {
            variantName = 'Default';
          }

          // Find the option value IDs for this variant
          const optionValueIds: string[] = [];
          if (variant.optionValues) {
            for (const ov of variant.optionValues) {
              const key = `${ov.optionName}:${ov.value}`;
              const valueId = optionValueMap.get(key);
              if (!valueId) {
                throw new BadRequestException(
                  `Option value "${ov.value}" for option "${ov.optionName}" not found. Make sure to define it in the options array.`,
                );
              }
              optionValueIds.push(valueId);
            }
          }

          await tx.productVariant.create({
            data: {
              productId: newProduct.id,
              name: variantName,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              isActive: variant.isActive ?? true,
              optionValues: optionValueIds.length > 0
                ? {
                    create: optionValueIds.map((id) => ({
                      optionValueId: id,
                    })),
                  }
                : undefined,
            },
          });
        }
      }

      return newProduct;
    });

    // Invalidate cache for product listings
    await this.cacheManager.del('products:list:*');
    
    // Fetch the complete product with all relations
    return this.findOne(product.id);
  }

  async findAll(skip = 0, take = 10, categoryId?: string, isActive?: boolean) {
    // OPTIMIZATION: Enforce max page size to prevent memory issues
    const MAX_PAGE_SIZE = 100;
    const limitedTake = Math.min(take || 10, MAX_PAGE_SIZE);

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // OPTIMIZATION: Limit nested relations to prevent N+1 and excessive data loading
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitedTake,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          options: {
            orderBy: { position: 'asc' },
            take: 10, // Limit variant options
            include: {
              values: {
                orderBy: { position: 'asc' },
                take: 20, // Limit option values
              },
            },
          },
          variants: {
            where: { isActive: true },
            take: 50, // Limit variants per product
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              stock: true,
              isActive: true,
              // Only include essential option value data
              optionValues: {
                take: 10,
                select: {
                  optionValue: {
                    select: {
                      id: true,
                      value: true,
                      option: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          images: {
            orderBy: { order: 'asc' },
            take: 10, // Limit images per product
            select: {
              id: true,
              url: true,
              alt: true,
              order: true,
              isPrimary: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      skip,
      take: limitedTake,
    };
  }

  async findOne(id: string) {
    // OPTIMIZATION: Check cache first
    const cacheKey = `product:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        sku: true,
        categoryId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        options: {
          orderBy: { position: 'asc' },
          take: 10,
          select: {
            id: true,
            name: true,
            position: true,
            values: {
              orderBy: { position: 'asc' },
              take: 20,
              select: {
                id: true,
                value: true,
                position: true,
              },
            },
          },
        },
        variants: {
          take: 50,
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stock: true,
            isActive: true,
            optionValues: {
              take: 10,
              select: {
                optionValue: {
                  select: {
                    id: true,
                    value: true,
                    option: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        images: {
          orderBy: { order: 'asc' },
          take: 10,
          select: {
            id: true,
            url: true,
            alt: true,
            order: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, product, 1800);
    return product;
  }

  async findBySlug(slug: string) {
    // OPTIMIZATION: Check cache first
    const cacheKey = `product:slug:${slug}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        sku: true,
        categoryId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        options: {
          orderBy: { position: 'asc' },
          take: 10,
          select: {
            id: true,
            name: true,
            position: true,
            values: {
              orderBy: { position: 'asc' },
              take: 20,
              select: {
                id: true,
                value: true,
                position: true,
              },
            },
          },
        },
        variants: {
          where: { isActive: true },
          take: 50,
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stock: true,
            isActive: true,
            optionValues: {
              take: 10,
              select: {
                optionValue: {
                  select: {
                    id: true,
                    value: true,
                    option: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        images: {
          orderBy: { order: 'asc' },
          take: 10,
          select: {
            id: true,
            url: true,
            alt: true,
            order: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, product, 1800);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id) as any;

    // Check slug uniqueness if being updated
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { slug: updateProductDto.slug },
        select: { id: true },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    // Check SKU uniqueness if being updated
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
        select: { id: true },
      });

      if (existingSku) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // For now, just update basic product fields
    // Variant options update would require more complex logic (delete + recreate)
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        name: updateProductDto.name,
        description: updateProductDto.description,
        slug: updateProductDto.slug,
        sku: updateProductDto.sku,
        categoryId: updateProductDto.categoryId,
        isActive: updateProductDto.isActive,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`product:${id}`);
    if (product?.slug) {
      await this.cacheManager.del(`product:slug:${product.slug}`);
    }
    await this.cacheManager.del('products:list:*');
    
    return this.findOne(updatedProduct.id);
  }

  async remove(id: string) {
    const product = await this.findOne(id) as any; // Check if exists

    await this.prisma.product.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cacheManager.del(`product:${id}`);
    if (product?.slug) {
      await this.cacheManager.del(`product:slug:${product.slug}`);
    }
    await this.cacheManager.del('products:list:*');

    return { message: 'Product deleted successfully' };
  }

  // Add a new variant to an existing product
  async addVariant(
    productId: string,
    variantData: {
      name?: string;
      sku?: string;
      price: number;
      stock: number;
      isActive?: boolean;
      optionValues?: { optionName: string; value: string }[];
    },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        options: {
          include: {
            values: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Build option value lookup
    const optionValueMap = new Map<string, string>();
    for (const option of product.options) {
      for (const value of option.values) {
        optionValueMap.set(`${option.name}:${value.value}`, value.id);
      }
    }

    // Auto-generate name if not provided
    let variantName = variantData.name;
    if (!variantName && variantData.optionValues) {
      variantName = variantData.optionValues.map((ov) => ov.value).join(' / ');
    }
    if (!variantName) {
      variantName = 'Default';
    }

    // Get option value IDs
    const optionValueIds: string[] = [];
    if (variantData.optionValues) {
      for (const ov of variantData.optionValues) {
        const key = `${ov.optionName}:${ov.value}`;
        const valueId = optionValueMap.get(key);
        if (!valueId) {
          throw new BadRequestException(
            `Option value "${ov.value}" for option "${ov.optionName}" not found.`,
          );
        }
        optionValueIds.push(valueId);
      }
    }

    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        name: variantName,
        sku: variantData.sku,
        price: variantData.price,
        stock: variantData.stock,
        isActive: variantData.isActive ?? true,
        optionValues:
          optionValueIds.length > 0
            ? {
                create: optionValueIds.map((id) => ({
                  optionValueId: id,
                })),
              }
            : undefined,
      },
      include: {
        optionValues: {
          include: {
            optionValue: {
              include: {
                option: true,
              },
            },
          },
        },
      },
    });

    return variant;
  }

  /**
   * OPTIMIZATION: Update variant stock with optimistic locking
   * Uses atomic operations to prevent race conditions in concurrent stock updates
   * @param variantId - Variant ID
   * @param quantity - Quantity to decrement (negative) or increment (positive)
   * @param expectedStock - Optional: expected current stock for optimistic locking
   * @returns Updated variant
   */
  async updateVariantStock(
    variantId: string,
    quantity: number,
    expectedStock?: number,
  ) {
    // OPTIMIZATION: Use atomic operation with optimistic locking
    // This prevents race conditions when multiple orders try to decrement stock simultaneously
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stock: true, updatedAt: true },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    // If expected stock is provided, use it for optimistic locking
    if (expectedStock !== undefined && variant.stock !== expectedStock) {
      throw new ConflictException(
        `Stock conflict: expected ${expectedStock}, but current stock is ${variant.stock}`,
      );
    }

    // Calculate new stock
    const newStock = variant.stock + quantity;

    // Prevent negative stock
    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock: cannot decrement ${quantity} from current stock of ${variant.stock}`,
      );
    }

    // OPTIMIZATION: Atomic update using where condition with current stock
    // This ensures the update only happens if stock hasn't changed
    const updated = await this.prisma.productVariant.updateMany({
      where: {
        id: variantId,
        stock: variant.stock, // Optimistic lock: only update if stock matches
      },
      data: { stock: newStock },
    });

    if (updated.count === 0) {
      // Stock was modified by another transaction
      throw new ConflictException(
        'Stock was modified by another transaction. Please retry.',
      );
    }

    // Return updated variant
    return this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        isActive: true,
      },
    });
  }

  /**
   * Decrement variant stock (for order creation)
   * OPTIMIZATION: Uses atomic operation to prevent race conditions
   */
  async decrementVariantStock(variantId: string, quantity: number) {
    return this.updateVariantStock(variantId, -quantity);
  }

  /**
   * Increment variant stock (for order cancellation/refund)
   * OPTIMIZATION: Uses atomic operation to prevent race conditions
   */
  async incrementVariantStock(variantId: string, quantity: number) {
    return this.updateVariantStock(variantId, quantity);
  }

  // Get products filtered by variant option values
  async findByOptionValues(
    filters: { optionName: string; value: string }[],
    skip = 0,
    take = 10,
  ) {
    // Find products that have variants with ALL specified option values
    const products = await this.prisma.product.findMany({
      where: {
        variants: {
          some: {
            AND: filters.map((filter) => ({
              optionValues: {
                some: {
                  optionValue: {
                    value: filter.value,
                    option: {
                      name: filter.optionName,
                    },
                  },
                },
              },
            })),
          },
        },
      },
      skip,
      take,
      include: {
        category: true,
        options: {
          orderBy: { position: 'asc' },
          include: {
            values: {
              orderBy: { position: 'asc' },
            },
          },
        },
        variants: {
          where: { isActive: true },
          include: {
            optionValues: {
              include: {
                optionValue: {
                  include: {
                    option: true,
                  },
                },
              },
            },
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return products;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
