import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsMongoId, IsDateString } from 'class-validator';

export class CreateMedicalCheckEventDTO {
    @ApiProperty({ description: 'Tiêu đề sự kiện kiểm tra y tế', example: 'Khám sức khỏe định kỳ khối 1' })
    @IsNotEmpty()
    @IsString()
    eventName: string;

    @ApiProperty({ description: 'ID khối lớp', example: '64faeaaeb44c9e2f12c157b1' })
    @IsNotEmpty()
    @IsMongoId()
    gradeId: string;

    @ApiPropertyOptional({ description: 'Mô tả chi tiết sự kiện kiểm tra y tế', example: 'Khám tổng quát đầu năm học' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Địa điểm tổ chức sự kiện', example: 'Trường Tiểu học ABC' })
    @IsNotEmpty()
    @IsString()
    location: string;

    @ApiProperty({ example: '2025-09-01T08:00:00.000Z', description: 'Ngày bắt đầu sự kiện (ISO format)' })
    @IsNotEmpty()
    @IsDateString()
    startRegistrationDate: Date;

    @ApiProperty({ example: '2025-09-01T17:00:00.000Z', description: 'Ngày kết thúc sự kiện (ISO format)' })
    @IsNotEmpty()
    @IsDateString()
    endRegistrationDate: Date;

    @ApiProperty({ description: 'Thời gian bắt đầu sự kiện', example: '2025-09-01T08:00:00.000Z' })
    @IsNotEmpty()
    @IsDateString()
    eventDate: Date;


    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsNotEmpty()
    @IsString()
    schoolYear: string;

    @ApiPropertyOptional({ description: 'Trạng thái sự kiện', enum: ['ongoing', 'completed', 'cancelled'], default: 'ongoing' })
    @IsOptional()
    @IsString()
    status?: 'ongoing' | 'completed' | 'cancelled';
}
