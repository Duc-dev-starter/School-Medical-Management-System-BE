import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDTO {
    @ApiProperty({ example: 'Action', description: 'Name of the category' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'Movies with action scenes', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}
