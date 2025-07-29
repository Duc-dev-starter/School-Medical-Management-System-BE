import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBooleanString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicalSupplyDTO extends PaginationRequestModel {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo nhà hỗ trợ', required: false })
    supplier?: string;


    @IsOptional()
    @IsBooleanString()
    @ApiProperty({
        description: 'Trạng thái xóa (true = đã xóa, false = chưa xóa)',
        required: false,
        example: 'false',
    })
    isDeleted?: string;
}
