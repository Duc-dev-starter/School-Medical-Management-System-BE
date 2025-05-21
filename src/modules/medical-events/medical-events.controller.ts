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
import { MedicalEventsService } from './medical-events.service';
import { CreateMedicalEventDto, SearchMedicalEventDTO, UpdateMedicalEventDTO } from './dto';
import { MedicalEvent } from './medical-events.schema';

@ApiTags('Medical Events')
@Controller('api/medical-events')
export class MedicalEventsController {
    constructor(private readonly medicalEventsService: MedicalEventsService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateMedicalEventDto })
    @Post('create')
    async create(@Body() model: CreateMedicalEventDto, @Request() req) {
        console.log(model, req.user);
        const blog = await this.medicalEventsService.create(model, req.user);
        return formatResponse<MedicalEvent>(blog);
    }

    @ApiOperation({ summary: 'Tìm kiếm sự kiện có phân trang' })
    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm sự kiện có phân trang' })
    @ApiQuery({ name: 'pageNum', required: false, example: 1, description: 'Trang hiện tại' })
    @ApiQuery({ name: 'pageSize', required: false, example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @Public()
    async findAll(@Query() query: SearchMedicalEventDTO) {
        return this.medicalEventsService.findAll(query);
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const blog = await this.medicalEventsService.findOne(id);
        return formatResponse<MedicalEvent>(blog);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateMedicalEventDTO })
    async updateBlog(
        @Param('id') id: string,
        @Body() model: UpdateMedicalEventDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const blog = await this.medicalEventsService.update(id, model, req.user);
        return formatResponse<MedicalEvent>(blog);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.medicalEventsService.remove(id);
        return formatResponse<boolean>(result);
    }
}
