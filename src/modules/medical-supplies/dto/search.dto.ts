import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicalSupplyDTO extends PaginationRequestModel {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    query?: string;
}
