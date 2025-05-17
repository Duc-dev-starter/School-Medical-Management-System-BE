import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { Blog } from './blogs.schema';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateBlogDTO, SearchBlogDTO, UpdateBlogDTO } from './dto';

@ApiTags('Blogs')
@Controller('api/blogs')
export class BlogsController {
  constructor(private readonly blogService: BlogsService) { }

  @ApiBearerAuth()
  @ApiBody({ type: CreateBlogDTO })
  @Post('create')
  async createBlog(@Body() model: CreateBlogDTO, @Request() req) {
    console.log(model, req.user);
    const blog = await this.blogService.create(model, req.user);
    return formatResponse<Blog>(blog);
  }

  @Get('search/:pageNum/:pageSize')
  @ApiOperation({ summary: 'Tìm kiếm danh mục có phân trang' })
  @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
  @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
  @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
  @ApiResponse({ status: 200 })
  @Public()
  async search(@Query() query: SearchBlogDTO) {
    const result = await this.blogService.search(query);
    return result;
  }

  @Public()
  @Get(':id')
  async getBlog(@Param('id') id: string) {
    const blog = await this.blogService.findOne(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return formatResponse<Blog>(blog);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiBody({ type: UpdateBlogDTO })
  async updateBlog(
    @Param('id') id: string,
    @Body() model: UpdateBlogDTO,
    @Req() req,
  ) {
    if (!model) {
      throw new CustomHttpException(
        HttpStatus.BAD_REQUEST,
        'You need to send data',
      );
    }
    const blog = await this.blogService.update(id, model, req.user);
    return formatResponse<Blog>(blog);
  }

  @Public()
  @ApiBearerAuth()
  @Delete(':id')
  async deleteBlog(@Param('id') id: string) {
    const result = await this.blogService.remove(id);
    return formatResponse<boolean>(result);
  }
}
