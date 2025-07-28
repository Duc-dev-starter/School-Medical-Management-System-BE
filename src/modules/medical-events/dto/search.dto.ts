import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';
import { ParentContactStatus, SeverityLevel } from './create.dto';

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
    @ApiProperty({ description: 'Tìm theo ID phụ huynh', required: false })
    parentId?: string;

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

    @ApiPropertyOptional({ description: 'Mức độ nghiêm trọng', enum: SeverityLevel })
    @IsOptional()
    @IsEnum(SeverityLevel)
    severityLevel?: SeverityLevel;

    @ApiPropertyOptional({ description: 'Trạng thái liên hệ phụ huynh', enum: ParentContactStatus })
    @IsOptional()
    @IsEnum(ParentContactStatus)
    parentContactStatus?: ParentContactStatus;
}
