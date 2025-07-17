import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMedicalCheckRegistrationDTO {
    @ApiProperty({ description: 'ID phụ huynh', example: '64faeaaeb44c9e2f12c157b9' })
    @IsNotEmpty()
    @IsMongoId()
    parentId: string;

    @ApiProperty({ description: 'ID học sinh', example: '64faeaaeb44c9e2f12c157a2' })
    @IsNotEmpty()
    @IsMongoId()
    studentId: string;

    @ApiProperty({ description: 'ID sự kiện kiểm tra y tế', example: '64faeaaeb44c9e2f12c157e1' })
    @IsNotEmpty()
    @IsMongoId()
    eventId: string;

    @ApiPropertyOptional({ description: 'Ghi chú thêm', example: 'Học sinh bị dị ứng với thuốc kháng sinh' })
    @IsOptional()
    @IsString()
    note?: string;


    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsNotEmpty()
    @IsString()
    schoolYear: string;
}