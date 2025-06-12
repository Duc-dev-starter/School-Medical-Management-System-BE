import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { formatResponse } from 'src/utils';
import { AppointmentService } from './appointments.service';
import { CreateParentNurseAppointmentDTO, UpdateParentNurseAppointmentStatusDTO } from './dto';
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

    // Có thể bổ sung các API lấy danh sách, chi tiết, ... nếu cần
}