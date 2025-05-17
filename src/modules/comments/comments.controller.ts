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
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { Comment } from './comments.schema';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateCommentDTO, SearchCommentDTO, UpdateCommentDTO } from './dto';

@ApiTags('Comments')
@Controller('api/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Post('create')
  @ApiBearerAuth()
  @ApiBody({ type: CreateCommentDTO })
  async createComment(@Body() model: CreateCommentDTO, @Request() req) {
    const comment = await this.commentsService.create(model, req.user);
    return formatResponse<Comment>(comment);
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm comment có phân trang' })
  @ApiQuery({ name: 'pageNum', required: true, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'pageSize', required: true, description: 'Số lượng bản ghi mỗi trang' })
  @ApiQuery({ name: 'blogId', required: false, description: 'ID của blog để lọc comment' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID của user để lọc comment' })
  @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm trong nội dung comment' })
  @Public()
  async searchComments(@Query() query: SearchCommentDTO) {
    const result = await this.commentsService.search(query);
    return result;
  }

  @Get(':id')
  @Public()
  async getComment(@Param('id') id: string) {
    const comment = await this.commentsService.findOne(id);
    return formatResponse<Comment>(comment);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiBody({ type: UpdateCommentDTO })
  async updateComment(
    @Param('id') id: string,
    @Body() model: UpdateCommentDTO,
    @Request() req,
  ) {
    if (!model || !model.content) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Dữ liệu cập nhật là bắt buộc');
    }
    const comment = await this.commentsService.update(id, model, req.user);
    return formatResponse<Comment>(comment);
  }

  @Delete(':id')
  @ApiBearerAuth()
  async deleteComment(@Param('id') id: string, @Request() req) {
    const result = await this.commentsService.remove(id, req.user);
    return formatResponse<boolean>(result);
  }
}