import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicalCheckEventDTO extends PaginationRequestModel {
    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo tên học sinh', required: false })
    query?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo ID người dùng', required: false })
    studentId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo ID người dùng', required: false })
    gradeId?: string;

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
    @ApiPropertyOptional({ description: 'Trạng thái đăng ký', enum: ['ongoing', 'completed', 'cancelled'] })
    status?: string;

    @IsOptional()
    @IsBooleanString()
    @ApiProperty({
        description: 'Trạng thái xóa (true = đã xóa, false = chưa xóa)',
        required: false,
        example: 'false',
    })
    isDeleted?: string;
}
