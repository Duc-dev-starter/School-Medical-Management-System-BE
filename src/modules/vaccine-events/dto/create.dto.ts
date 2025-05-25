import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateVaccineEventDTO {
    @ApiProperty({ example: 'Tiêm phòng cúm mùa', description: 'Tiêu đề sự kiện tiêm chủng', uniqueItems: true })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b1', description: 'ID của khối lớp' })
    @IsNotEmpty()
    @IsString()
    gradeId: string;

    @ApiProperty({ example: 'Sự kiện tiêm chủng định kỳ cho học sinh khối 1', description: 'Mô tả sự kiện', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 'Vaccine cúm mùa', description: 'Tên vaccine' })
    @IsNotEmpty()
    @IsString()
    vaccineName: string;

    @ApiProperty({ example: 'Trường Tiểu học ABC', description: 'Địa điểm tiêm chủng' })
    @IsNotEmpty()
    @IsString()
    location: string;

    @ApiProperty({ example: '2025-09-01T08:00:00.000Z', description: 'Ngày bắt đầu sự kiện (ISO format)' })
    @IsNotEmpty()
    @IsDateString()
    startDate: Date;

    @ApiProperty({ example: '2025-09-01T17:00:00.000Z', description: 'Ngày kết thúc sự kiện (ISO format)' })
    @IsNotEmpty()
    @IsDateString()
    endDate: Date;
}
