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
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { Public } from 'src/common/decorators/public.decorator';
import { VaccineAppoimentsService } from './vaccine-appointments.service';
import { CreateVaccineAppointmentDTO, SearchVaccineAppointmentDTO, UpdateVaccineAppointment } from './dto';
import { VaccineAppointment } from './vaccine-appoinments.schema';


@ApiTags('Vaccine Appointments')
@Controller('api/vaccine-appointments')
export class VaccineAppoimentsController {
    constructor(private readonly vaccineAppointmentService: VaccineAppoimentsService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateVaccineAppointmentDTO })
    @Post('create')
    async create(@Body() model: CreateVaccineAppointmentDTO, @Request() req) {
        console.log(model, req.user);
        const result = await this.vaccineAppointmentService.create(model);
        return formatResponse<VaccineAppointment>(result);
    }

    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm danh mục có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
    @ApiQuery({ name: 'eventId', required: false, description: 'ID của sự kiện' })
    @ApiResponse({ status: 200 })
    @Public()
    async findAll(@Query() query: SearchVaccineAppointmentDTO) {
        const result = await this.vaccineAppointmentService.search(query);
        return result;
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const medicineSubmission = await this.vaccineAppointmentService.findOne(id);
        return formatResponse<VaccineAppointment>(medicineSubmission);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateVaccineAppointment })
    async update(
        @Param('id') id: string,
        @Body() model: UpdateVaccineAppointment,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const result = await this.vaccineAppointmentService.update(id, model);
        return formatResponse<VaccineAppointment>(result);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.vaccineAppointmentService.remove(id);
        return formatResponse<boolean>(result);
    }
}
