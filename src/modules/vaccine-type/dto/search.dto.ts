import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBooleanString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchVaccineTypeDTO extends PaginationRequestModel {
    @ApiProperty({
        description: 'Tìm kiếm từ khóa',
        required: false,
    })
    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsBooleanString()
    @ApiProperty({
        description: 'Trạng thái xóa (true = đã xóa, false = chưa xóa)',
        required: false,
        example: 'false',
    })
    isDeleted?: string;
}
