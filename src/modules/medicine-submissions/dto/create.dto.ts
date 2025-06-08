import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class MedicineSubmissionDetailDTO {
    @ApiProperty({ description: 'Tên thuốc' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Liều lượng', example: '1 viên' })
    @IsString()
    @IsOptional()
    dosage?: string;

    @ApiProperty({ description: 'Hướng dẫn sử dụng', example: 'Uống sau ăn' })
    @IsString()
    @IsOptional()
    usageInstructions?: string;

    @ApiProperty({ description: 'Số lượng', example: 10 })
    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @ApiProperty({ description: 'Số lần mỗi ngày', example: 3 })
    @IsNumber()
    @IsNotEmpty()
    timesPerDay: number;

    @ApiProperty({ description: 'Các khung giờ uống', example: ['08:00', '12:00', '20:00'] })
    @IsArray()
    @IsString({ each: true })
    timeSlots: string[];

    @ApiProperty({ description: 'Ngày bắt đầu', example: '2025-06-06' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ description: 'Ngày kết thúc', example: '2025-06-10' })
    @IsDateString()
    endDate: string;
}

export class CreateMedicineSubmissionDTO {
    @ApiProperty({ description: 'ID phụ huynh', type: String })
    @IsMongoId()
    @IsNotEmpty()
    parentId: string;

    @ApiProperty({ description: 'ID học sinh', type: String })
    @IsMongoId()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({ description: 'ID y tá', type: String })
    @IsMongoId()
    @IsNotEmpty()
    schoolNurseId: string;

    @ApiProperty({ type: [MedicineSubmissionDetailDTO] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MedicineSubmissionDetailDTO)
    medicines: MedicineSubmissionDetailDTO[];
}