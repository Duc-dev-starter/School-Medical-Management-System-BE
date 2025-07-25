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
    Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { Public } from 'src/common/decorators/public.decorator';
import { MedicalSuppliesService } from './medical-supplies.service';
import { CreateMedicalSupplyDTO, SearchMedicalSupplyDTO, UpdateMedicalSupplyDTO } from './dto';
import { MedicalSupply } from './medical-supplies.schema';
import { Response } from 'express';
import { ImportMedicalSupplyQuantityDTO } from './dto/import.dto';

@ApiTags('Medical Supplies')
@Controller('api/medical-supplies')
export class MedicalSuppliesController {
    constructor(private readonly medicalSuppliesService: MedicalSuppliesService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateMedicalSupplyDTO })
    @Post('create')
    async create(@Body() model: CreateMedicalSupplyDTO, @Request() req) {
        console.log(model, req.user);
        const medicalSupply = await this.medicalSuppliesService.create(model);
        return formatResponse<MedicalSupply>(medicalSupply);
    }

    @Get('search/:pageNum/:pageSize')
    @ApiOperation({ summary: 'Tìm kiếm danh mục có phân trang' })
    @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
    @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
    @ApiQuery({ name: 'categoryId', required: false, description: 'ID của danh mục medicalSupply' })
    @ApiResponse({ status: 200 })
    @Public()
    async search(@Query() query: SearchMedicalSupplyDTO) {
        const result = await this.medicalSuppliesService.findAll(query);
        return result;
    }

    @Public()
    @Get(':id')
    async getBlog(@Param('id') id: string) {
        const medicalSupply = await this.medicalSuppliesService.findOne(id);
        return formatResponse<MedicalSupply>(medicalSupply);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateMedicalSupplyDTO })
    async update(
        @Param('id') id: string,
        @Body() model: UpdateMedicalSupplyDTO,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const medicalSupply = await this.medicalSuppliesService.update(id, model);
        return formatResponse<MedicalSupply>(medicalSupply);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.medicalSuppliesService.remove(id);
        return formatResponse<boolean>(result);
    }

    @Get('export/excel')
    @ApiBearerAuth()
    async exportExcel(@Query() query: SearchMedicalSupplyDTO, @Res() res: Response) {
        await this.medicalSuppliesService.exportExcel(query, res);
    }

    @Post(':id/import')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Nhập thêm số lượng cho vật tư' })
    @ApiParam({ name: 'id', description: 'ID vật tư' })
    @ApiBody({ type: ImportMedicalSupplyQuantityDTO })
    @ApiResponse({ status: 200, type: MedicalSupply })
    async importQuantity(
        @Param('id') id: string,
        @Body() body: ImportMedicalSupplyQuantityDTO
    ) {
        const result = await this.medicalSuppliesService.importQuantity(id, body.addQuantity);
        return formatResponse(result);
    }
}
