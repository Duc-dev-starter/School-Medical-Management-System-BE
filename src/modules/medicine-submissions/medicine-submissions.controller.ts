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
import { MedicineSubmissionsService } from './medicine-submissions.service';
import { CreateMedicineSubmissionDTO, SearchMedicineSubmissionDTO, UpdateMedicineSubmissionDTO } from './dto';
import { MedicineSubmission } from './medicine-submissions.schema';

@ApiTags('MedicineSubmissions')
@Controller('api/medicine-submissions')
export class MedicineSubmissionsController {
    constructor(private readonly medicineSubmissionService: MedicineSubmissionsService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateMedicineSubmissionDTO })
    @Post('create')
    async create(@Body() model: CreateMedicineSubmissionDTO, @Request() req) {
        console.log(model, req.user);
        const medicineSubmission = await this.medicineSubmissionService.create(model, req.user);
        return formatResponse<MedicineSubmission>(medicineSubmission);
    }

    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm danh mục có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
    @ApiQuery({ name: 'categoryId', required: false, description: 'ID của danh mục medicine Submission' })
    @ApiResponse({ status: 200 })
    @Public()
    async findAll(@Query() query: SearchMedicineSubmissionDTO) {
        const result = await this.medicineSubmissionService.search(query);
        return result;
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const medicineSubmission = await this.medicineSubmissionService.findOne(id);
        return formatResponse<MedicineSubmission>(medicineSubmission);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateMedicineSubmissionDTO })
    async update(
        @Param('id') id: string,
        @Body() model: UpdateMedicineSubmissionDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const medicineSubmission = await this.medicineSubmissionService.update(id, model, req.user);
        return formatResponse<MedicineSubmission>(medicineSubmission);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.medicineSubmissionService.remove(id, req.user);
        return formatResponse<boolean>(result);
    }
}
