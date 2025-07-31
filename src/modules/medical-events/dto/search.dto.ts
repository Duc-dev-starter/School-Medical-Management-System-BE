import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsBooleanString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';
import { ParentContactStatus } from './create.dto';

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


    @ApiPropertyOptional({ description: 'Trạng thái liên hệ phụ huynh', enum: ParentContactStatus })
    @IsOptional()
    @IsEnum(ParentContactStatus)
    parentContactStatus?: ParentContactStatus;

    @IsOptional()
    @IsBooleanString()
    @ApiProperty({
        description: 'Trạng thái xóa (true = đã xóa, false = chưa xóa)',
        required: false,
        example: 'false',
    })
    isDeleted?: string;
}
