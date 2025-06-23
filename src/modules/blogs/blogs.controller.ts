import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
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
    return formatResponse(blog);
  }

  @ApiOperation({ summary: 'Tìm kiếm blog có phân trang' })
  @Get('search')
  @ApiQuery({ name: 'pageNum', required: false, example: 1, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'pageSize', required: false, example: 10, description: 'Số lượng bản ghi mỗi trang' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @Public()
  async search(@Query() query: SearchBlogDTO) {
    return this.blogService.search(query);
  }

  @Public()
  @Get(':id')
  async getBlog(@Param('id') id: string) {
    const blog = await this.blogService.findOne(id);
    return formatResponse(blog);
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
    return formatResponse(blog);
  }

  @ApiBearerAuth()
  @Delete(':id')
  async deleteBlog(@Param('id') id: string, @Req() req,) {
    const result = await this.blogService.remove(id, req.user);
    return formatResponse(result);
  }
}