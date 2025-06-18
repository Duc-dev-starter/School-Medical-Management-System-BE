import {
    IsNotEmpty,
    IsMongoId,
    IsOptional,
    IsNumber,
    IsString,
    IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicalCheckAppointmentDTO {
    @ApiProperty({ example: '64fabc123456abc123456def' })
    @IsNotEmpty()
    @IsMongoId()
    studentId: string;

    @ApiProperty({ example: '64facb789012abc123456abc' })
    @IsNotEmpty()
    @IsMongoId()
    eventId: string;

    @ApiProperty({ example: '64fadef123456abc12345678', required: false })
    @IsOptional()
    @IsMongoId()
    checkedBy?: string;

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

    @ApiProperty({ example: 'Tình trạng bình thường', required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ example: true })
    @IsNotEmpty()
    @IsBoolean()
    isHealthy: boolean;

    @ApiProperty({ example: 'Huyết áp cao', required: false })
    @IsOptional()
    @IsString()
    reasonIfUnhealthy?: string;


    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsNotEmpty()
    @IsString()
    schoolYear: string;
}
