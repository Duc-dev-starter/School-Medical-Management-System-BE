import { IsOptional, IsMongoId, IsBoolean, IsString, IsBooleanString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicalCheckAppointmentDTO extends PaginationRequestModel {
    @ApiPropertyOptional({ example: '64fabc123456abc123456def' })
    @IsOptional()
    @IsMongoId()
    studentId?: string;

    @ApiPropertyOptional({ example: '64facb789012abc123456abc' })
    @IsOptional()
    @IsMongoId()
    eventId?: string;

    @ApiPropertyOptional({ example: '64fadef123456abc12345678' })
    @IsOptional()
    @IsMongoId()
    checkedBy?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isHealthy?: boolean;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo tên học sinh', required: false })
    query?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Năm học (school year), ví dụ: 2024-2025',
        required: false,
        example: '2024-2025'
    })
    schoolYear?: string;

    @ApiPropertyOptional({ description: 'Trạng thái sự kiện', enum: ['pending', 'checked', 'cancelled', "ineligible", 'medicalChecked'], default: 'pending' })
    @IsOptional()
    @IsString()
    status?: 'pending' | 'checked' | 'cancelled' | "ineligible" | 'medicalChecked';

    @IsOptional()
    @IsBooleanString()
    @ApiProperty({
        description: 'Trạng thái xóa (true = đã xóa, false = chưa xóa)',
        required: false,
        example: 'false',
    })
    isDeleted?: string;
}

