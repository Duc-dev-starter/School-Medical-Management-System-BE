import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchBlogDTO extends PaginationRequestModel {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Từ khóa tìm kiếm (tên, email, số điện thoại)',
    required: false,
  })
  query?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Lọc theo categoryId',
    required: false,
  })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Lọc theo userId',
    required: false,
  })
  userId?: string;
}
