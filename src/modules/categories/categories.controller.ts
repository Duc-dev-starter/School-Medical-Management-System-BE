import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from './categories.schema';
import { formatResponse } from 'src/utils';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateCategoryDTO, SearchCategoryDTO, UpdateCategoryDTO } from './dto';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('api/categories')
export class CategoriesController {
    constructor(private readonly service: CategoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo danh mục mới' })
    @ApiBody({ type: CreateCategoryDTO })
    @ApiResponse({ status: 201, type: Category })
    async create(@Body() payload: CreateCategoryDTO) {
        const category = await this.service.create(payload);
        return formatResponse(category);
    }

    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm danh mục có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
    @ApiResponse({ status: 200 })
    @Public()
    async search(@Query() query: SearchCategoryDTO) {
        const result = await this.service.search(query);
        return result;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin danh mục theo ID' })
    @ApiParam({ name: 'id', description: 'ID danh mục' })
    @ApiResponse({ status: 200, type: Category })
    async findOne(@Param('id') id: string) {
        const category = await this.service.findOne(id);
        return formatResponse(category);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật danh mục' })
    @ApiParam({ name: 'id' })
    @ApiBody({ type: UpdateCategoryDTO })
    @ApiResponse({ status: 200, type: Category })
    async update(@Param('id') id: string, @Body() payload: UpdateCategoryDTO) {
        const updated = await this.service.update(id, payload);
        return formatResponse(updated);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa danh mục' })
    @ApiParam({ name: 'id', description: 'ID của danh mục cần xóa' })
    @ApiResponse({ status: 200, description: 'Trả về true nếu xóa thành công', type: Boolean })
    async remove(@Param('id') id: string): Promise<boolean> {
        return await this.service.remove(id);
    }

}
