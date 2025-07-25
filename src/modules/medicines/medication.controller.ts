import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { CreateMedicineDTO, SearchMedicinesDTO, UpdateMedicineDTO } from './dto';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MedicinesService } from './medicines.service';
import { Medicine } from './medicines.schema';
import { formatResponse } from 'src/utils';
import { Public } from 'src/common/decorators/public.decorator';
import { ImportMedicineQuantityDTO } from './dto/import.dto';

@ApiTags('Medicines')
@Controller('api/medicines')
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo thuốc mới' })
  @ApiBody({ type: CreateMedicineDTO })
  @ApiResponse({ status: 201, type: Medicine })
  async create(@Body() payload: CreateMedicineDTO) {
    const category = await this.medicinesService.create(payload);
    return formatResponse(category);
  }

  @Get('search/:pageNum/:pageSize')
  @ApiOperation({ summary: 'Tìm kiếm thuốc có phân trang' })
  @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
  @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
  @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
  @ApiResponse({ status: 200 })
  @Public()
  async search(@Query() query: SearchMedicinesDTO) {
    const result = await this.medicinesService.search(query);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin thuốc theo ID' })
  @ApiParam({ name: 'id', description: 'ID thuốc' })
  @ApiResponse({ status: 200, type: Medicine })
  async findOne(@Param('id') id: string) {
    const category = await this.medicinesService.findOne(id);
    return formatResponse(category);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thuốc' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateMedicineDTO })
  @ApiResponse({ status: 200, type: Medicine })
  async update(@Param('id') id: string, @Body() payload: UpdateMedicineDTO) {
    const updated = await this.medicinesService.update(id, payload);
    return formatResponse(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thuốc' })
  @ApiParam({ name: 'id', description: 'ID của thuốc cần xóa' })
  @ApiResponse({ status: 200, description: 'Trả về true nếu xóa thành công', type: Boolean })
  async remove(@Param('id') id: string): Promise<boolean> {
    return await this.medicinesService.remove(id);
  }

  @Post(':id/import')
  @ApiOperation({ summary: 'Nhập thêm số lượng cho thuốc' })
  @ApiParam({ name: 'id', description: 'ID thuốc' })
  @ApiBody({ type: ImportMedicineQuantityDTO })
  @ApiResponse({ status: 200, type: Medicine })
  async importQuantity(
    @Param('id') id: string,
    @Body() body: ImportMedicineQuantityDTO
  ) {
    const result = await this.medicinesService.importQuantity(id, body.addQuantity);
    return formatResponse(result);
  }
}