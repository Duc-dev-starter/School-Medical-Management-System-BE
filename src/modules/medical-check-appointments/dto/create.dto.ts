import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMedicalCheckAppointmentDTO {
    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b1', description: 'ID học sinh' })
    @IsMongoId()
    studentId: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b2', description: 'ID sự kiện khám y tế' })
    @IsMongoId()
    eventId: string;

    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsString()
    schoolYear: string;

    @ApiProperty({ example: 160, required: false, description: 'Chiều cao (cm)' })
    @IsOptional()
    @IsNumber()
    height?: number;

    @ApiProperty({ example: 50, required: false, description: 'Cân nặng (kg)' })
    @IsOptional()
    @IsNumber()
    weight?: number;

    @ApiProperty({ example: 19.5, required: false, description: 'Chỉ số BMI' })
    @IsOptional()
    @IsNumber()
    bmi?: number;

    @ApiProperty({ example: 1.0, required: false, description: 'Thị lực mắt trái' })
    @IsOptional()
    @IsNumber()
    visionLeft?: number;

    @ApiProperty({ example: 1.0, required: false, description: 'Thị lực mắt phải' })
    @IsOptional()
    @IsNumber()
    visionRight?: number;

    @ApiProperty({ example: '120/80', required: false, description: 'Huyết áp' })
    @IsOptional()
    @IsString()
    bloodPressure?: string;

    @ApiProperty({ example: 70, required: false, description: 'Nhịp tim (bpm)' })
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

    @ApiProperty({ example: true, description: 'Học sinh có khỏe mạnh không?' })
    @IsBoolean()
    isHealthy: boolean;

    @ApiProperty({ example: 'Huyết áp cao', required: false, description: 'Lý do không khỏe mạnh' })
    @IsOptional()
    @IsString()
    reasonIfUnhealthy?: string;

    @ApiProperty({ example: 'Khám tổng quát bình thường', required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ example: '2025-07-24T08:00:00.000Z', required: false, description: 'Thời gian khám y tế' })
    @IsOptional()
    @IsDateString()
    medicalCheckedAt?: Date;
}
