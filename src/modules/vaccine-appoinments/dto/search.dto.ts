// src/vaccine/dto/search-vaccine-appointment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsMongoId, IsBoolean, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchVaccineAppointmentDTO extends PaginationRequestModel {
    @ApiPropertyOptional({ example: '64fb0a2c8f1b2c3d4e5f6789', description: 'Lọc theo ID học sinh' })
    @IsOptional()
    @IsMongoId()
    studentId?: string;

    @ApiPropertyOptional({ example: '64fb0a2c8f1b2c3d4e5f6790', description: 'Lọc theo ID sự kiện tiêm chủng' })
    @IsOptional()
    @IsMongoId()
    eventId?: string;

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
    @ApiProperty({ description: 'Tìm theo ID y tá', required: false })
    checkBy?: string;

}
