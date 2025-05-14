import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchUserDto {
  @ApiProperty({ description: 'query', example: 'name or phone or email', required: false })
  @IsOptional()
  @IsString()
  query?: string;

 
}
