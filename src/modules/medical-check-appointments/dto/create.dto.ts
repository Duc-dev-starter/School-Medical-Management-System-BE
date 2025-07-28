import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckMedicalCheckAppointmentDTO {
    @ApiProperty({ example: 160, required: false })
    @IsOptional()
    @IsNumber()
    height?: number;

    @ApiProperty({ example: 50, required: false })
    @IsOptional()
    @IsNumber()
    weight?: number;

    @ApiProperty({ example: 1.0, required: false })
    @IsOptional()
    @IsNumber()
    visionLeft?: number;

    @ApiProperty({ example: 1.0, required: false })
    @IsOptional()
    @IsNumber()
    visionRight?: number;

    @ApiProperty({ example: '120/80', required: false })
    @IsOptional()
    @IsString()
    bloodPressure?: string;

    @ApiProperty({ example: 70, required: false })
    @IsOptional()
    @IsNumber()
    heartRate?: number;

    @ApiProperty({ example: 'Răng bình thường', required: false })
    @IsOptional()
    @IsString()
    dentalHealth?: string;

    @ApiProperty({ example: 'Tai mũi họng tốt', required: false })
    @IsOptional()
    @IsString()
    entHealth?: string;

    @ApiProperty({ example: 'Da không vấn đề', required: false })
    @IsOptional()
    @IsString()
    skinCondition?: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    isHealthy: boolean;

    @ApiProperty({ example: 'Huyết áp cao', required: false })
    @IsOptional()
    @IsString()
    reasonIfUnhealthy?: string;

    @ApiProperty({ example: 'Khám tổng quát bình thường', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
