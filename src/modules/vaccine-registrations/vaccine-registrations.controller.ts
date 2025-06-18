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
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateVaccineRegistrationDTO, SearchVaccineRegistrationDTO, UpdateRegistrationStatusDTO, UpdateVaccineRegistrationDTO } from './dto';
import { VaccineRegistration } from './vaccine-registrations.schema';
import { VaccineRegistrationsServices } from './vaccine-registrations.service';

@ApiTags('Vaccine Registration')
@Controller('api/vaccine-registration')
export class VaccineRegistrationsController {
    constructor(private readonly vaccineRegistrationService: VaccineRegistrationsServices) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateVaccineRegistrationDTO })
    @Post('create')
    async create(@Body() model: CreateVaccineRegistrationDTO, @Request() req) {
        const result = await this.vaccineRegistrationService.create(model);
        return formatResponse<VaccineRegistration>(result);
    }

    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm danh sách đăng kí tiêm vaccine có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
    @ApiQuery({ name: 'studentId', required: false, description: 'ID học sinh' })
    @ApiQuery({ name: 'eventId', required: false, description: 'ID của sự kiện' })
    @ApiQuery({ name: 'parentId', required: false, description: 'ID phu huyn' })

    @ApiResponse({ status: 200 })
    @Public()
    async findAll(@Query() query: SearchVaccineRegistrationDTO) {
        const result = await this.vaccineRegistrationService.findAll(query);
        return result;
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const medicineSubmission = await this.vaccineRegistrationService.findOne(id);
        return formatResponse<VaccineRegistration>(medicineSubmission);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateVaccineRegistrationDTO })
    async update(
        @Param('id') id: string,
        @Body() model: UpdateVaccineRegistrationDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const result = await this.vaccineRegistrationService.update(id, model);
        return formatResponse<VaccineRegistration>(result);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.vaccineRegistrationService.remove(id);
        return formatResponse<boolean>(result);
    }

    @Patch(':id/status')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật trạng thái đơn đăng ký tiêm vaccine' })
    @ApiResponse({ status: 200, description: 'Thay đổi thành công' })
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateRegistrationStatusDTO,
    ) {
        return this.vaccineRegistrationService.updateStatus(id, dto);
    }
}
