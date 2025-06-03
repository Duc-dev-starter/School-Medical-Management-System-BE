import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsDateString } from 'class-validator';

export class CheckMedicalCheckAppointmentDTO {
    @ApiPropertyOptional({ example: '120/80', description: 'Huyết áp' })
    @IsOptional()
    @IsString()
    bloodPressure?: string;

    @ApiProperty({ example: true, description: 'Học sinh đủ điều kiện tiêm' })
    @IsBoolean()
    isEligible: boolean;

    @ApiPropertyOptional({ example: 'Đang bị cúm', description: 'Lý do không đủ điều kiện tiêm' })
    @IsOptional()
    @IsString()
    reasonIfIneligible?: string;

    @ApiPropertyOptional({ example: 'Bé hơi lo lắng', description: 'Ghi chú khác' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ example: '2025-06-01T08:00:00.000Z', description: 'Thời gian tiêm (nếu tiêm luôn)' })
    @IsOptional()
    @IsDateString()
    checkedAt?: Date;

    @ApiPropertyOptional({ example: '2025-06-01T08:00:00.000Z', description: 'Thời gian tiêm (nếu tiêm luôn)' })
    @IsOptional()
    @IsDateString()
    medicalCheckedAt?: Date;
}