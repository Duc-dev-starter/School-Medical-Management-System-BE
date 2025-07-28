import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchVaccineTypeDTO extends PaginationRequestModel {
    @ApiProperty({
        description: 'Tìm kiếm từ khóa',
        required: false,
    })
    @IsOptional()
    @IsString()
    query?: string;
}
