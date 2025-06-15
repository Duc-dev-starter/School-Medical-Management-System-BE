import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Patch,
    Req,
    UseGuards,
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
import { formatResponse } from 'src/utils';
import { AppointmentService } from './appointments.service';
import { CreateParentNurseAppointmentDTO, SearchAppointmentDTO, UpdateParentNurseAppointmentStatusDTO } from './dto';
import { ParentNurseAppointment } from './appointments.schema';

@ApiBearerAuth()
@ApiTags('Appointments')
@Controller('api/appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentService) { }

    @Post()
    @ApiOperation({ summary: 'Phụ huynh đặt lịch hẹn với nurse' })
    @ApiBody({ type: CreateParentNurseAppointmentDTO })
    @ApiResponse({ status: 201, type: ParentNurseAppointment })
    async create(@Body() payload: CreateParentNurseAppointmentDTO, @Req() req) {
        const appointment = await this.appointmentsService.create(payload, req.user);
        return formatResponse(appointment);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Manager duyệt và phân nurse cho lịch hẹn' })
    @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
    @ApiBody({ type: UpdateParentNurseAppointmentStatusDTO })
    @ApiResponse({ status: 200, type: ParentNurseAppointment })
    async approve(
        @Param('id') id: string,
        @Body() dto: UpdateParentNurseAppointmentStatusDTO,
        @Req() req
    ) {
        const appointment = await this.appointmentsService.approveAndAssignNurse(id, dto.nurseId as string, req.user);
        return formatResponse(appointment);
    }

    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm lịch hẹn có phân trang & lọc' })
    @ApiParam({ name: 'pageNum', example: 1 })
    @ApiParam({ name: 'pageSize', example: 10 })
    @ApiQuery({ name: 'query', required: false })
    @ApiQuery({ name: 'parentId', required: false })
    @ApiQuery({ name: 'studentId', required: false })
    @ApiQuery({ name: 'nurseId', required: false })
    @ApiQuery({ name: 'managerId', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'type', required: false })
    async search(
        @Param('pageNum') pageNum: number,
        @Param('pageSize') pageSize: number,
        @Query() query: Omit<SearchAppointmentDTO, 'pageNum' | 'pageSize'>
    ) {
        const params: SearchAppointmentDTO = {
            ...query,
            pageNum: Number(pageNum),
            pageSize: Number(pageSize),
        };
        return await this.appointmentsService.search(params);
    }
}