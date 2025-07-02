import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsISO8601 } from 'class-validator';

export class UpdateMedicineSlotStatusDTO {
    @ApiProperty({ description: 'ID chi tiết thuốc', example: '666b1b7d2e8f8a1234567890' })
    @IsString()
    medicineDetailId: string;

    @ApiProperty({ description: 'Thời gian uống thuốc (ISO)', example: '2025-07-02T14:00:00.000Z' })
    @IsISO8601()
    time: string; // ISO date string

    @ApiProperty({ description: 'Trạng thái', enum: ['taken', 'missed', 'compensated'], example: 'taken' })
    @IsEnum(['taken', 'missed', 'compensated'])
    status: 'taken' | 'missed' | 'compensated';

    @ApiPropertyOptional({ description: 'Ghi chú', example: 'Uống bù sau 10 phút' })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional({ description: 'Ảnh xác nhận uống thuốc', example: 'https://domain.com/image.jpg' })
    @IsOptional()
    @IsString()
    image?: string;
}