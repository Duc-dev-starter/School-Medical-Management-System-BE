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
import { VaccineEventServices } from './vaccine-events.service';
import { CreateVaccineEventDTO, SearchVaccineEventDTO, UpdateVaccineEventDTO } from './dto';
import { VaccineEvent } from './vaccine-events.schema';

@ApiTags('Vaccine Events')
@Controller('api/vaccine-events')
export class VaccineEventsController {
    constructor(private readonly vaccineEventService: VaccineEventServices) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateVaccineEventDTO })
    @Post('create')
    async create(@Body() model: CreateVaccineEventDTO, @Request() req) {
        console.log(model, req.user);
        const result = await this.vaccineEventService.create(model);
        return formatResponse<VaccineEvent>(result);
    }

    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm danh mục có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
    @ApiResponse({ status: 200 })
    @Public()
    async findAll(@Query() query: SearchVaccineEventDTO) {
        const result = await this.vaccineEventService.search(query);
        return result;
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const medicineSubmission = await this.vaccineEventService.findOne(id);
        return formatResponse<VaccineEvent>(medicineSubmission);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateVaccineEventDTO })
    async update(
        @Param('id') id: string,
        @Body() model: UpdateVaccineEventDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const result = await this.vaccineEventService.update(id, model);
        return formatResponse<VaccineEvent>(result);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.vaccineEventService.remove(id);
        return formatResponse<boolean>(result);
    }
}
