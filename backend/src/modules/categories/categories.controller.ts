import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { ParseObjectIdPipe } from '@common/pipes/parse-object-id.pipe.js';
import { CategoryNotFoundException } from '@common/exceptions/domain.exceptions.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async findAll() {
    return this.categoriesService.findAllCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'The category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    const category = await this.categoriesService.findById(id);
    if (!category) {
      throw new CategoryNotFoundException(id);
    }
    return category;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a category' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    const exists = await this.categoriesService.exists({ _id: id, isActive: true });
    if (!exists) {
      throw new CategoryNotFoundException(id);
    }
    await this.categoriesService.softDelete(id);
  }
}
