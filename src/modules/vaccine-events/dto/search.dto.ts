import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchVaccineEventDTO extends PaginationRequestModel {
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
        description: 'Năm học (school year), ví dụ: 2024-2025',
        required: false,
        example: '2024-2025'
    })
    schoolYear?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo ID khối', required: false })
    gradeId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Trạng thái sự kiện (pending, active, completed)',
        required: false,
        enum: ['ongoing', 'completed', 'cancelled'],
    })
    status?: string;
}
