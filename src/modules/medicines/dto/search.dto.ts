import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicinesDTO extends PaginationRequestModel {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Từ khóa tìm kiếm (tên, email, số điện thoại)',
    required: false,
  })
  query?: string;
}
