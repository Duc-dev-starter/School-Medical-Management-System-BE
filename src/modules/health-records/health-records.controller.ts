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
import { HealthRecordsService } from './health-records.service';
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { HealthRecord } from './health-records.schema';
import {
    CreateHealthRecordDTO,
    SearchHealthRecordDTO,
    UpdateHealthRecordDTO,
} from './dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Health Records')
@Controller('api/health-records')
export class HealthRecordsController {
    constructor(private readonly healthRecordsService: HealthRecordsService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateHealthRecordDTO })
    @Post('create')
    async create(@Body() model: CreateHealthRecordDTO, @Request() req) {
        const record = await this.healthRecordsService.create(model, req.user);
        return formatResponse<HealthRecord>(record);
    }

    @Public()
    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm hồ sơ sức khỏe có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (tên, email, số điện thoại)' })
    @ApiQuery({ name: 'userId', required: false, description: 'ID của người dùng' })
    @ApiResponse({ status: 200 })
    async search(@Query() query: SearchHealthRecordDTO) {
        const result = await this.healthRecordsService.search(query);
        return result;
    }

    @Public()
    @Get(':id')
    async getOne(@Param('id') id: string) {
        const record = await this.healthRecordsService.findOne(id);
        return formatResponse<HealthRecord>(record);
    }

    @ApiBearerAuth()
    @Put(':id')
    @ApiBody({ type: UpdateHealthRecordDTO })
    async update(
        @Param('id') id: string,
        @Body() model: UpdateHealthRecordDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'Bạn cần gửi dữ liệu',
            );
        }
        const updatedRecord = await this.healthRecordsService.update(id, model, req.user);
        return formatResponse<HealthRecord>(updatedRecord);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req) {
        const result = await this.healthRecordsService.remove(id, req.user);
        return formatResponse<boolean>(result);
    }
}
