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
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';

import { Public } from 'src/common/decorators/public.decorator';
import { MedicalCheckAppointmentsService } from './medical-check-appointments.service';
import { CreateMedicalCheckAppointmentDTO, SearchMedicalCheckAppointmentDTO, UpdateMedicalCheckAppointmentDTO } from './dto';
import { MedicalCheckAppointment } from './medical-check-appointments.schema';

@ApiTags('Medical Check Appoiment')
@Controller('api/medical-check-appoinments')
export class MedicalCheckAppoimentsController {
    constructor(private readonly medicalCheckAppoimentService: MedicalCheckAppointmentsService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateMedicalCheckAppointmentDTO })
    @Post('create')
    async create(@Body() model: CreateMedicalCheckAppointmentDTO, @Request() req) {
        const item = await this.medicalCheckAppoimentService.create(model, req.user);
        return formatResponse<MedicalCheckAppointment>(item);
    }

    @Public()
    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm hồ sơ sức khỏe có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (tên, email, số điện thoại)' })
    @ApiQuery({ name: 'userId', required: false, description: 'ID của người dùng' })
    @ApiResponse({ status: 200 })
    async findAll(@Query() query: SearchMedicalCheckAppointmentDTO) {
        const result = await this.medicalCheckAppoimentService.findAll(query);
        return result;
    }

    @Public()
    @Get(':id')
    async getOne(@Param('id') id: string) {
        const record = await this.medicalCheckAppoimentService.findOne(id);
        return formatResponse<MedicalCheckAppointment>(record);
    }

    @ApiBearerAuth()
    @Put(':id')
    @ApiBody({ type: UpdateMedicalCheckAppointmentDTO })
    async update(
        @Param('id') id: string,
        @Body() model: UpdateMedicalCheckAppointmentDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'Bạn cần gửi dữ liệu',
            );
        }
        const updatedRecord = await this.medicalCheckAppoimentService.update(id, model, req.user);
        return formatResponse<MedicalCheckAppointment>(updatedRecord);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req) {
        const result = await this.medicalCheckAppoimentService.remove(id);
        return formatResponse<boolean>(result);
    }
}
