import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    IsDateString,
    Min,
    Max,
} from 'class-validator';

export class CheckMedicalCheckAppointmentDTO {
    @ApiPropertyOptional({ example: 160, description: 'Chiều cao (cm)' })
    @IsOptional()
    @IsNumber()
    @Min(30)
    @Max(250)
    height?: number;

    @ApiPropertyOptional({ example: 50, description: 'Cân nặng (kg)' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(300)
    weight?: number;

    @ApiPropertyOptional({ example: 1.0, description: 'Thị lực mắt trái (VD: 1.0)' })
    @IsOptional()
    @IsNumber()
    visionLeft?: number;

    @ApiPropertyOptional({ example: 1.0, description: 'Thị lực mắt phải (VD: 1.0)' })
    @IsOptional()
    @IsNumber()
    visionRight?: number;

    @ApiPropertyOptional({ example: '120/80', description: 'Huyết áp (mmHg)' })
    @IsOptional()
    @IsString()
    bloodPressure?: string;

    @ApiPropertyOptional({ example: 70, description: 'Nhịp tim (bpm)' })
    @IsOptional()
    @IsNumber()
    heartRate?: number;

    @ApiPropertyOptional({ example: 'Răng miệng bình thường', description: 'Tình trạng răng miệng' })
    @IsOptional()
    @IsString()
    dentalHealth?: string;

    @ApiPropertyOptional({ example: 'Tai-mũi-họng ổn định', description: 'Tình trạng tai mũi họng' })
    @IsOptional()
    @IsString()
    entHealth?: string;

    @ApiPropertyOptional({ example: 'Không có vấn đề', description: 'Tình trạng da liễu' })
    @IsOptional()
    @IsString()
    skinCondition?: string;

    @ApiProperty({ example: true, description: 'Học sinh có khỏe mạnh hay không' })
    @IsBoolean()
    isHealthy: boolean;

    @ApiPropertyOptional({ example: 'Đang bị cúm', description: 'Lý do không đủ điều kiện sức khỏe' })
    @IsOptional()
    @IsString()
    reasonIfUnhealthy?: string;

    @ApiPropertyOptional({ example: 'Bé hơi lo lắng', description: 'Ghi chú thêm' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ example: '2025-06-01T08:00:00.000Z', description: 'Thời gian khám' })
    @IsOptional()
    @IsDateString()
    medicalCheckedAt?: Date;
}
