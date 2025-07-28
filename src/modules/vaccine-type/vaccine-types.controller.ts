import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
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
import { VaccineTypesService } from './vaccine-types.service';
import { VaccineType } from './vaccine-types.schema';
import { formatResponse } from 'src/utils';
import { Public } from 'src/common/decorators/public.decorator';
import {
    CreateVaccineTypeDTO,
    SearchVaccineTypeDTO,
    UpdateVaccineTypeDTO,
} from './dto';

@ApiBearerAuth()
@ApiTags('Vaccine Types')
@Controller('api/vaccine-types')
export class VaccineTypesController {
    constructor(private readonly vaccineTypesService: VaccineTypesService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo loại vaccine mới' })
    @ApiBody({ type: CreateVaccineTypeDTO })
    @ApiResponse({ status: 201, type: VaccineType })
    async create(@Body() payload: CreateVaccineTypeDTO) {
        const type = await this.vaccineTypesService.create(payload);
        return formatResponse(type);
    }

    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm loại vaccine có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (mã hoặc tên vaccine)' })
    @ApiResponse({ status: 200 })
    @Public()
    async search(@Query() query: SearchVaccineTypeDTO) {
        const result = await this.vaccineTypesService.search(query);
        return result;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin loại vaccine theo ID' })
    @ApiParam({ name: 'id', description: 'ID loại vaccine' })
    @ApiResponse({ status: 200, type: VaccineType })
    async findOne(@Param('id') id: string) {
        const type = await this.vaccineTypesService.findOne(id);
        return formatResponse(type);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật loại vaccine' })
    @ApiParam({ name: 'id' })
    @ApiBody({ type: UpdateVaccineTypeDTO })
    @ApiResponse({ status: 200, type: VaccineType })
    async update(@Param('id') id: string, @Body() payload: UpdateVaccineTypeDTO) {
        const updated = await this.vaccineTypesService.update(id, payload);
        return formatResponse(updated);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa loại vaccine' })
    @ApiParam({ name: 'id', description: 'ID loại vaccine cần xóa' })
    @ApiResponse({ status: 200, description: 'Trả về true nếu xóa thành công', type: Boolean })
    async remove(@Param('id') id: string): Promise<boolean> {
        return await this.vaccineTypesService.remove(id);
    }
}
