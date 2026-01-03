import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  InternalServerErrorException,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post("create")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(
    @Query("skip", new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query("take", new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query("isActive", new DefaultValuePipe(undefined)) isActive?: string
  ) {
    try {
      const isActiveBool =
        isActive === "true" ? true : isActive === "false" ? false : undefined;
      return this.categoriesService.findAll(skip, take, isActiveBool);
    } catch (error) {
      console.error("Error in findAll categories", error);
      throw new InternalServerErrorException("Error in findAll categories");
    }
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Patch("update/:id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  update(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete("delete/:id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
