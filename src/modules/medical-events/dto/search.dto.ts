import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicalEventDTO extends PaginationRequestModel {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo ID học sinh', required: false })
    studentId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo ID y tá', required: false })
    schoolNurseId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ApiProperty({ description: 'Tìm theo ID thuốc', required: false })
    medicinesId?: string[];


    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ApiProperty({ description: 'Tìm theo ID vật tư', required: false })
    medicalSuppliesId?: string[];
}
