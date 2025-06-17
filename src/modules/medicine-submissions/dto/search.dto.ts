import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicineSubmissionDTO extends PaginationRequestModel {
    @ApiPropertyOptional()
    @IsOptional()
    @IsMongoId()
    parentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsMongoId()
    studentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsMongoId()
    schoolNurseId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    query?: string;
}
