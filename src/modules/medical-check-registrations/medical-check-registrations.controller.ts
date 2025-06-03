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
import { MedicalCheckRegistrationsService } from './medical-check-registrations.service';
import { CreateMedicalCheckRegistrationDTO, SearchMedicalCheckRegistrationDTO, UpdateMedicalCheckRegistrationDTO, UpdateRegistrationStatusDTO } from './dto';
import { MedicalCheckRegistration } from './medical-check-registrations.schema';

@ApiTags('Medical Check Registration')
@Controller('api/medical-check-registration')
export class MedicalCheckRegistrationsController {
    constructor(private readonly medicalCheckRegistrationService: MedicalCheckRegistrationsService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateMedicalCheckRegistrationDTO })
    @Post('create')
    async create(@Body() model: CreateMedicalCheckRegistrationDTO, @Request() req) {
        console.log(model, req.user);
        const result = await this.medicalCheckRegistrationService.create(model, req.user);
        return formatResponse<MedicalCheckRegistration>(result);
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
    async findAll(@Query() query: SearchMedicalCheckRegistrationDTO) {
        return this.medicalCheckRegistrationService.findAll(query);
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const blog = await this.medicalCheckRegistrationService.findOne(id);
        return formatResponse<MedicalCheckRegistration>(blog);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateMedicalCheckRegistrationDTO })
    async updateBlog(
        @Param('id') id: string,
        @Body() model: UpdateMedicalCheckRegistrationDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const blog = await this.medicalCheckRegistrationService.update(id, model, req.user);
        return formatResponse<MedicalCheckRegistration>(blog);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.medicalCheckRegistrationService.remove(id);
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
        return this.medicalCheckRegistrationService.updateStatus(id, dto);
    }
}
