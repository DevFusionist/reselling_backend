import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const slug =
      createCategoryDto.slug || this.generateSlug(createCategoryDto.name);

    // OPTIMIZATION: Use select to check existence only
    const existingName = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
      select: { id: true },
    });

    if (existingName) {
      throw new ConflictException('Category with this name already exists');
    }

    // OPTIMIZATION: Use select to check existence only
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingSlug) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        slug,
        isActive: createCategoryDto.isActive ?? true,
      },
    });
  }

  async findAll(skip = 0, take = 10, isActive?: boolean) {
    // OPTIMIZATION: Enforce max page size
    const MAX_PAGE_SIZE = 100;
    const limitedTake = Math.min(take || 10, MAX_PAGE_SIZE);

    const where: { isActive?: boolean } = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limitedTake,
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      total,
      skip,
      take: limitedTake,
    };
  }

  async findOne(id: string) {
    // OPTIMIZATION: Use select to fetch only required fields
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string) {
    // OPTIMIZATION: Use select to fetch only required fields
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    // Check name uniqueness if being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      // OPTIMIZATION: Use select to check existence only
      const existingName = await this.prisma.category.findUnique({
        where: { name: updateCategoryDto.name },
        select: { id: true },
      });

      if (existingName) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Check slug uniqueness if being updated
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      // OPTIMIZATION: Use select to check existence only
      const existingSlug = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
        select: { id: true },
      });

      if (existingSlug) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    // OPTIMIZATION: Use select to fetch only required fields
    return this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
        slug: updateCategoryDto.slug,
        isActive: updateCategoryDto.isActive,
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
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

