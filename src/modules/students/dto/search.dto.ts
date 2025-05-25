import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchStudentDTO extends PaginationRequestModel {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Từ khóa tìm kiếm (tên, email, số điện thoại)',
        required: false,
    })
    query?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Lọc theo classId',
        required: false,
    })
    classId?: string;


    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Lọc theo parentId',
        required: false,
    })
    parentId?: string;
}
