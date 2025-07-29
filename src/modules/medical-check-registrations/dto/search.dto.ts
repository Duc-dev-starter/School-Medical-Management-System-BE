import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicalCheckRegistrationDTO extends PaginationRequestModel {
    @ApiPropertyOptional({ description: 'ID học sinh' })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiPropertyOptional({ description: 'ID phụ huynh' })
    @IsOptional()
    @IsString()
    parentId?: string;

    @ApiPropertyOptional({ description: 'ID sự kiện' })
    @IsOptional()
    @IsString()
    eventId?: string;

    @ApiPropertyOptional({ description: 'Trạng thái đăng ký', enum: ['pending', 'approved', 'rejected', 'cancelled'] })
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo tên học sinh', required: false })
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
