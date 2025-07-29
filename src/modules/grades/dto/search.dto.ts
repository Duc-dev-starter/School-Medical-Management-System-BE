import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchGradeDTO extends PaginationRequestModel {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Từ khóa tìm kiếm (tên, email, số điện thoại)',
        required: false,
    })
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
