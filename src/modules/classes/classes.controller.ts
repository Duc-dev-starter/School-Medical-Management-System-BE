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
import { ClassesService } from './classes.service';
import { CreateClassDTO, SearchClassDTO, UpdateClassDTO } from './dto';
import { Class } from './classes.schema';

@ApiTags('Classes')
@Controller('api/classes')
export class ClassesController {
    constructor(private readonly classService: ClassesService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateClassDTO })
    @Post('create')
    async create(@Body() model: CreateClassDTO, @Request() req) {
        const result = await this.classService.create(model);
        return formatResponse<Class>(result);
    }

    @ApiOperation({ summary: 'Tìm kiếm khối có phân trang' })
    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm khối có phân trang' })
    @ApiQuery({ name: 'pageNum', required: false, example: 1, description: 'Trang hiện tại' })
    @ApiQuery({ name: 'pageSize', required: false, example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false })
    @Public()
    async findAll(@Query() query: SearchClassDTO) {
        return this.classService.search(query);
    }


    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.classService.findOne(id);
        return formatResponse<Class>(result);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateClassDTO })
    async updateBlog(
        @Param('id') id: string,
        @Body() model: UpdateClassDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const result = await this.classService.update(id, model);
        return formatResponse<Class>(result);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.classService.remove(id);
        return formatResponse<boolean>(result);
    }
}
