import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateMedicineSubmissionDTO {
    @ApiProperty()
    @IsMongoId()
    @IsNotEmpty()
    parentId: string;

    @ApiProperty()
    @IsMongoId()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty()
    @IsMongoId()
    @IsNotEmpty()
    medicineId: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    dosage?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    usageInstructions?: string;

    @ApiProperty()
    @IsDateString()
    startDate: Date;

    @ApiProperty()
    @IsDateString()
    endDate: Date;
}
