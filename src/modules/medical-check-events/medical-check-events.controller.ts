import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
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
import { MedicalCheckEvent } from './medical-check-events.schema';
import { CreateMedicalCheckEventDTO, SearchMedicalCheckEventDTO, UpdateEventStatusDTO, UpdateMedicalCheckEventDTO } from './dto';
import { MedicalCheckEventsService } from './medical-check-events.service';

@ApiTags('Medical Check Events')
@Controller('api/medical-check-events')
export class MedicalCheckEventsController {
    constructor(private readonly medicalCheckEventsService: MedicalCheckEventsService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateMedicalCheckEventDTO })
    @Post('create')
    async create(@Body() model: CreateMedicalCheckEventDTO, @Request() req) {
        console.log(model, req.user);
        const item = await this.medicalCheckEventsService.create(model, req.user);
        return formatResponse<MedicalCheckEvent>(item);
    }

    @ApiOperation({ summary: 'Tìm kiếm sự kiện có phân trang' })
    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm sự kiện có phân trang' })
    @ApiQuery({ name: 'pageNum', required: false, example: 1, description: 'Trang hiện tại' })
    @ApiQuery({ name: 'pageSize', required: false, example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'studentId', required: false, description: 'ID học sinh' })
    @Public()
    async findAll(@Query() query: SearchMedicalCheckEventDTO) {
        return this.medicalCheckEventsService.findAll(query);
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const blog = await this.medicalCheckEventsService.findOne(id);
        return formatResponse<MedicalCheckEvent>(blog);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateMedicalCheckEventDTO })
    async updateBlog(
        @Param('id') id: string,
        @Body() model: UpdateMedicalCheckEventDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const blog = await this.medicalCheckEventsService.update(id, model, req.user);
        return formatResponse<MedicalCheckEvent>(blog);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.medicalCheckEventsService.remove(id);
        return formatResponse<boolean>(result);
    }


    @Patch(':id/status')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật trạng thái sự kiện tiêm vaccine' })
    @ApiResponse({ status: 200, description: 'Thay đổi thành công' })
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateEventStatusDTO,
    ) {
        return this.medicalCheckEventsService.updateStatus(id, dto.status);
    }
}
