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
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { Public } from 'src/common/decorators/public.decorator';
import { GradesService } from './grades.service';
import { CreateGradeDTO, SearchGradeDTO, UpdateGradeDTO } from './dto';
import { Grade } from './grades.schema';

@ApiTags('Grades')
@Controller('api/grades')
export class GradessController {
    constructor(private readonly gradeService: GradesService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateGradeDTO })
    @Post('create')
    async create(@Body() model: CreateGradeDTO, @Request() req) {
        console.log(model, req.user);
        const result = await this.gradeService.create(model);
        return formatResponse<Grade>(result);
    }

    @ApiOperation({ summary: 'Tìm kiếm khối có phân trang' })
    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm khối có phân trang' })
    @ApiQuery({ name: 'pageNum', required: false, example: 1, description: 'Trang hiện tại' })
    @ApiQuery({ name: 'pageSize', required: false, example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false })
    @Public()
    async findAll(@Query() query: SearchGradeDTO) {
        return this.gradeService.search(query);
    }


    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.gradeService.findOne(id);
        return formatResponse<Grade>(result);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateGradeDTO })
    async updateBlog(
        @Param('id') id: string,
        @Body() model: UpdateGradeDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const result = await this.gradeService.update(id, model);
        return formatResponse<Grade>(result);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.gradeService.remove(id);
        return formatResponse<boolean>(result);
    }
}
