import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchHealthRecordDTO extends PaginationRequestModel {
    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo tên học sinh', required: false })
    query?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo ID người dùng', required: false })
    userId?: string;
}
